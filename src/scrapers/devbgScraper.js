import puppeteer from 'puppeteer';
import mysql from 'mysql2';


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'my-secret-pw',
    database: 'job_mapper',
    port: 3307
});

connection.connect((err) => {
    if (err) {
        return console.error('error connecting: ' + err.stack);
    }
    console.log('connected as id ' + connection.threadId);
});

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
                title: document.querySelector('.job-title').innerText,
                time: document.querySelector('time').innerText,
                location: document.querySelector('.badge').innerText,
                description: document.querySelector('.job_description').innerText,
                icons: Array.from(document.querySelectorAll('.attachment-medium.size-medium'))
                    .map(img => img.title),
                categories: Array.from(document.querySelectorAll('.pill'))
                    .map(a => a.innerText),
                company: {
                    description: document.querySelector('.box-company p').innerText,
                    profile: document.querySelector('.box-company a').href,
                    logo: document.querySelector('.company-logo').getAttribute('src')
                },
            };
            return jobData;
        });

        const query = 'INSERT INTO job_listings (job_title, time_posted, job_location, job_description, company_description, company_profile_url, company_logo_url, icon_titles, category_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

        connection.query(query, [
            job.title,
            job.time,
            job.location,
            job.description,
            job.company.description,
            job.company.profile,
            job.company.logo,
            job.icons.join(','),
            job.categories.join(',')],
            (error, results) => {
                if (error) {
                    console.error('Error inserting data:', error);
                    return;
                }
                console.log('Data successfully inserted:', results);
            });


    }

    await browser.close();
    connection.end();
}

export { scrapeJobListings };
