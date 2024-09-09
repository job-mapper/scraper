import { scrapeJobListings } from "./scrapers/devbgScraper.js";

async function main() {
    const jobListings = await scrapeJobListings();
    console.log(jobListings);
}

main();