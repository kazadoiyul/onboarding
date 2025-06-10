import { Actor } from 'apify';
import {log} from "crawlee"

interface Product {
    title: string;
    asin: string;
    itemUrl: string;
    keyword?: string;
    description?: string;
    sellerName: string;
    offer: string;
}

interface ActorInput {
    defaultDatasetId: string;
}


await Actor.init();

const rawInput = await Actor.getInput() as ActorInput | null;
if (!rawInput || !rawInput.defaultDatasetId) {
    log.error('Input is missing the "defaultDatasetId" property.');
    await Actor.exit();
    throw new Error('Input error: "defaultDatasetId" is required.');
}

const sourceStore = await Actor.openDataset(rawInput.defaultDatasetId);
const { items: rawItems } = await sourceStore.getData();

let rows : Product[] = [];
if (rawItems && Array.isArray(rawItems)) {
    rows = rawItems as Product[];
    log.info(`Retrieved ${rawItems.length} items from Dataset.`);
} else {
    log.warning(`No valid 'items' array found in Dataset ${rawInput.defaultDatasetId}. No products to process.`);
}


const best_items: { [key: string]: Product } = {};

for (const product of rows) {
    log.info(product.asin);

    if (!best_items[product.title] || priceOf(best_items[product.title]) > priceOf(product)){
        best_items[product.title] = product
    }

}

// printDict(best_items);

Object.values(best_items).forEach(async value => {
    await Actor.pushData(value);
})

const dataset = await Actor.openDataset();
const items = await dataset.getData();

await Actor.setValue('OUTPUT', {
    items
});


await Actor.exit();


function priceOf (obj : Product) {
    const str = obj.offer.replace('$', '')
    return parseFloat(str);
}

function printDict (dict: { [x: string]: any; }) {
    for (let key in dict) {
        console.log(dict[key]);
    }
}
