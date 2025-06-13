import { createCheerioRouter, log } from 'crawlee';
import { BASE_URL, labels } from './constants.js';
import {Actor} from "apify";

import {tracker} from './tracker.js';

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
            log.warning(`Found undefined! ${element.attr('data-asin')}`);
            continue;
        }

        const url = `${BASE_URL}${titleElement.attr('href')}`;

        log.info(`Processing ${titleElement.first().text().trim()}`);

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

    const { data } = request.userData;

    const element = $('div#productDescription');
    const description = element.text().trim();
    log.debug(`description is: ${description}`);

    tracker.updateCount(data.asin)

    await crawler.addRequests([{
        url: `${BASE_URL}/gp/aod/ajax/ref=auto_load_aod?asin=${data.asin}&pc=dp`,
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


