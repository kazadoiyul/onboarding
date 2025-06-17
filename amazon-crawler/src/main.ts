import { Actor } from 'apify';
import {stats} from './statistics.js'
import { CheerioCrawler, log } from 'crawlee';
import { url } from "./constants.js";
import { router } from './routes.js';

await Actor.init();
await stats.init()

log.info('Actor starting...');

const input = await Actor.getInput();

if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid input: expected an object with a "keyword" property');
}

const { keyword } = input as { keyword: string };

log.info(`Entered keyword is: ${keyword}`);

const proxyConfiguration = await Actor.createProxyConfiguration({
    groups : ['RESIDENTIAL'],
    countryCode: 'US',
})

const crawler = new CheerioCrawler({
    requestHandler: router,
    proxyConfiguration: proxyConfiguration,
    useSessionPool: true,
    sessionPoolOptions: {
        sessionOptions: {
            maxErrorScore: 1,
            maxUsageCount: 5,
        },
    },
    errorHandler: async ({ error, request }) => {
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ) {
            log.debug(error.message);
            stats.addToErrors(request.url, error?.message);
        }
    },
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




