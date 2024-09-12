import { scrapeJobListings } from "./scrapers/devbgScraper.js";
import { receiveMessages } from "./consumers/consumer.js";

async function main() {
    receiveMessages();
    const jobListings = await scrapeJobListings();
}

main();