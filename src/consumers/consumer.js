import AWS from 'aws-sdk';

AWS.config.update({ region: 'eu-north-1' });

const sqs = new AWS.SQS();

const queueUrl = 'https://sqs.eu-north-1.amazonaws.com/626635404006/Test2';

const receiveParams = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10, // Adjust the number of messages to process at once
    VisibilityTimeout: 20,
    WaitTimeSeconds: 5, // Long polling
};

// Function to receive and process messages
export function receiveMessages() {
    sqs.receiveMessage(receiveParams, (err, data) => {
        if (err) {
            console.log("Receive Error", err);
        } else if (data.Messages) {
            data.Messages.forEach((message) => {
                // Process the message (here, just logging it)
                const jobData = JSON.parse(message.Body);
                console.log("Processing Job Data:", jobData);

                // After processing, delete the message from the queue
                const deleteParams = {
                    QueueUrl: queueUrl,
                    ReceiptHandle: message.ReceiptHandle
                };

                sqs.deleteMessage(deleteParams, (deleteErr, deleteData) => {
                    if (deleteErr) {
                        console.log("Delete Error", deleteErr);
                    } else {
                        console.log("Message Deleted", deleteData);
                    }
                });
            });
        }
    });
}

// Poll for new messages every 5 seconds
setInterval(receiveMessages, 5000);
