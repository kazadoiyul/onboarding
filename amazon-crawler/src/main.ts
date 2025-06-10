import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';
import { url } from "./constants.js";
import { router } from './routes.js';

await Actor.init();

log.info('Actor starting...');

const input = await Actor.getInput();

if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid input: expected an object with a "keyword" property');
}

const { keyword } = input as { keyword: string };

log.info(keyword);


const crawler = new CheerioCrawler({
    requestHandler: router,
});

await crawler.addRequests([
    {
        url: `${url.BASE}${url.SEARCH}?${url.KEY_QUERY}${keyword}`,
        label: 'START',
        userData: {
            keyword,
        },
    },
]);



log.info('Starting the crawl.');
await crawler.run();
log.info('Crawl finished.');

const dataset = await Actor.openDataset();
const { items } = await dataset.getData();

await Actor.setValue('OUTPUT', {
    rows: items
});

await Actor.exit();




