import AWS from 'aws-sdk';
import mysql from 'mysql2';

AWS.config.update({ region: 'eu-north-1' });

const sqs = new AWS.SQS();
const connection = mysql.createConnection({
    host: 'database-1.ctmeg0eqc4g3.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'sakatards',
    database: 'innodb',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        return console.error('error connecting: ' + err.stack);
    }
    console.log('connected as id ' + connection.threadId);
});

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
                const jobData = JSON.parse(message.Body);
                console.log("Processing Job Data:", jobData);

                const query = 'INSERT INTO jobs_listings7 (job_title) VALUES (?)';

                connection.query(query, [
                    jobData.title,
                    // job.time,
                    // job.location,
                    // job.description,
                    // // job.company.description,
                    // job.company.profile,
                    // job.company.logo,
                    // job.icons.join(','),
                    // job.categories.join(',')],
                ],
                    (error, results) => {
                        if (error) {
                            console.error('Error inserting data:', error);
                            return;
                        }
                        console.log('Data successfully inserted:', results);
                    });


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
connection.end();

// Poll for new messages every 5 seconds
setInterval(receiveMessages, 5000);
