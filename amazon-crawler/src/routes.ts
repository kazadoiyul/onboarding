import { createCheerioRouter, log } from 'crawlee';
import { BASE_URL, labels } from './constants.js';
import {Actor} from "apify";


export const router = createCheerioRouter();

router.addHandler(labels.START, async ({ $, crawler, request }) => {
    const { keyword } = request.userData;

    const currentPageUrl = request.url;

    log.info(`Current page URL: ${currentPageUrl}`);

    const products = $('div > div[data-asin]:not([data-asin=""])');

    for (const product of products) {
        const element = $(product);
        const titleElement = $(element.find('.a-text-normal[href]'));

        if (!titleElement.attr('href')) {
            log.warning(`found undefined in here!${element.attr('data-asin') || "idk"}`);
            continue;
        }
        log.debug(`Starting ${titleElement.attr('href')}`);

        const url = `${BASE_URL}${titleElement.attr('href')}`;

        log.info(`Processing ${titleElement.first().text().trim()}`);
        log.debug(element.attr('data-asin') || "idk");
        log.info(`link is:  ${url}`);

        await crawler.addRequests([{
            url,
            label: labels.PRODUCT,
            userData: {
                data: {
                    title: titleElement.first().text().trim(),
                    asin: element.attr('data-asin'),
                    itemUrl: url,
                    keyword,
                },
            },
        }]);
    }

});

router.addHandler(labels.PRODUCT, async ({ $, crawler, request }) => {

    // setInterval(() => {}, 2000);

    const { data } = request.userData;

    const element = $('div#productDescription');
    const description = element.text().trim();
    log.debug(`description is: ${description}`);

    setInterval(() => {}, 2000);

    await crawler.addRequests([{
        url: `${BASE_URL}/gp/aod/ajax/ref=auto_load_aod?asin=${data.asin}&pc=dp`,
        // url: `${BASE_URL}/gp/aod/ajax?asin=${data.asin}&pc=dp`,
        label: labels.OFFERS,
        userData: {
            data: {
                ...data,
                description: description
            },
        },
    }]);
});

router.addHandler(labels.OFFERS, async ({ $, request }) => {
    const { data } = request.userData;

    for (const offer of $('#aod-offer')) {
        const element = $(offer);

        // await Dataset.pushData({
        //     ...data,
        //     sellerName: element.find('div[id*="soldBy"] a[aria-label]').text().trim(),
        //     offer: element.find('.a-price .a-offscreen').text().trim(),
        // });
        const elementPrice = element.find('.a-price .a-offscreen').text().trim();
        if (!elementPrice) {
            continue;
        }
        await Actor.pushData({
            ...data,
            sellerName: element.find('div[id*="soldBy"] a[aria-label]').text().trim(),
            offer: elementPrice,
        });
    }
});


