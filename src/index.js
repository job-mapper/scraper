import { scrapeJobListings } from "./scrapers/devbgScraper.js";
import { receiveMessages } from "./scrapers/consumer.js";

async function main() {
    // receiveMessages();
    const jobListings = await scrapeJobListings();
    // console.log(jobListings);
}

main();