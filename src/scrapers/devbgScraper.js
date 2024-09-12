import puppeteer from 'puppeteer';
import aws from 'aws-sdk';

aws.config.update({ region: 'eu-north-1' });

const sqs = new aws.SQS();

async function scrapeJobListings() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://dev.bg/?s=&post_type=job_listing');
    const allPagesLinks = [];

    const lastPage = await page.evaluate(() => {
        const pages = document.querySelectorAll('.page-numbers');
        const pagesNumbers = Array.from(pages).map(page => page.outerText);
        return pagesNumbers[pagesNumbers.length - 2];
    })
    //hardcoded to 2 pages for testing purposes
    for (let i = 0; i < 2; i++) {
        const currPage = Number(i);
        const currPageUrl = `https://dev.bg/page/${currPage}/?s&post_type=job_listing#038;post_type=job_listing`
        const page = await browser.newPage();
        await page.goto(currPageUrl);

        const jobLinks = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('.job-list-item a');
            const links = Array.from(jobElements).map(job => job.href);

            return links.filter((link, i) => i % 2 === 0);
        });
        allPagesLinks.push(...jobLinks);
    }

    for (const link of allPagesLinks) {
        const jobPage = await browser.newPage();
        await jobPage.goto(link);

        const job = await jobPage.evaluate(() => {

            const jobData = {
                title: document.querySelector('.job-title').innerText.trim(),
                // time: document.querySelector('time').innerText,
                // location: document.querySelector('.badge').innerText.trim(),
                // description: document.querySelector('.job_description')?.innerText.trim() ? document.querySelector('.job_description').innerText.trim() : 'hardcoded description',
                // icons: Array.from(document.querySelectorAll('.attachment-medium.size-medium'))
                //     .map(img => img.title.trim()),
                // categories: Array.from(document.querySelectorAll('.pill'))
                //     .map(a => a.innerText.trim()),
                // company: {
                //     // description: document.querySelector('.box-company p').innerText.trim(),
                //     profile: document.querySelector('.box-company a').href.trim(),
                //     logo: document.querySelector('.company-logo').getAttribute('src').trim()
                // },
            };
            return jobData;
        });

        const params = {
            MessageBody: JSON.stringify(job),
            QueueUrl: 'https://sqs.eu-north-1.amazonaws.com/626635404006/Test2',
        };

        sqs.sendMessage(params, (err, data) => {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.MessageId);
            }
        });
    }

    await browser.close();
}

export { scrapeJobListings };
