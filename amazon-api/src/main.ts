import {Actor} from 'apify';
import { DownloadItemsFormat  } from 'apify-client';
import { ApifyClient } from 'apify-client';
import {log, sleep} from "crawlee";


await Actor.init();

const input = await Actor.getInput();

const { useClient, memory, fields, maxItems } = input as {useClient : boolean,  memory: number, fields: string[], maxItems: number};

console.log('Actor input:', input);
const TOKEN = 'apify_api_SYcA47uqNc0jTWqzZ1EGrE4wbwHh5f4e7l9o'
const TARGET_ACTOR = 'kazadoiyul~amazon-crawler'

let outputData = {};
let keyword = "iphone";
let rawData = []

if (useClient) {
    const client = Actor.newClient()
    const { defaultDatasetId } = await client.actor(TARGET_ACTOR).call(
        {keyword : keyword},
        {memory: memory}
        );

    const { items, total } = await client.dataset(defaultDatasetId).listItems(
    //     {
    //     limit : 10,
    //     offset: 0,
    // }
    );

    let allItems = [];
    allItems.push(...items);
    log.info('Getting all items:', allItems);
    rawData.push(...items);
}
else {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");
    // myHeaders.append("Authorization", `Bearer ${Actor.getEnv().token}`);

    const raw = JSON.stringify({
        keyword : keyword
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    log.info('Sending request body', requestOptions);

    const url = `https://api.apify.com/v2/acts/${TARGET_ACTOR}/run-sync-get-dataset-items?token=${TOKEN}&memory=${memory}`;

    // @ts-ignore
    const request = await fetch(url, requestOptions)
    const data = await request.json();

    // log.info('Received: ', data.map((el: { asin: any; }) => el.asin));
    //log.info('Received: ', data);
    console.log('Sending request body', data);
    rawData.push(...data);
}

log.info('hereeeee')

let count = 0;
for (const key in rawData) {
    if (rawData.hasOwnProperty(key)) {
        if (parseInt(key) >= maxItems) {
            log.info(`The key is: ${key}`)
            break;
        }
        const originalItem = rawData[key];
        const filteredItem = {};
        for (const col of fields) {
            if (originalItem.hasOwnProperty(col)) {
                // @ts-ignore
                filteredItem[col] = originalItem[col];
            }
        }
        // @ts-ignore
        outputData[key] = filteredItem;
        count++;
    }
}

log.info('Output dataset looks like:', outputData);
sleep(99999)

Actor.exit()
