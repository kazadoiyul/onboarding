import {Actor} from 'apify';
import {log} from "crawlee";
import { TOKEN, TARGET_ACTOR, TYPE } from "./constants.js"
import {stringify} from "node:querystring";

await Actor.init();

const input = await Actor.getInput();

const { useClient, memory, fields, maxItems } = input as {useClient : boolean,  memory: number, fields: string[], maxItems: number};

let outputData : any[] = []
let keyword = "iphone m";
let rawData = []

if (useClient) {
    const client = Actor.newClient()
    const { defaultDatasetId } = await client.actor(TARGET_ACTOR).call(
        {keyword : keyword},
        {memory: memory}
        );

    const { items } = await client.dataset(defaultDatasetId).listItems({limit : 10});
    rawData.push(...items);
}
else {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", TYPE);
    myHeaders.append("Accept", TYPE);

    const raw = JSON.stringify({
        keyword : keyword
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    } as unknown as Request;

    const url = `https://api.apify.com/v2/acts/${TARGET_ACTOR}/run-sync-get-dataset-items?token=${TOKEN}&memory=${memory}&maxItems=${maxItems}`;

    const request = await fetch(url, requestOptions)
    const data = await request.json();
    rawData.push(...data.slice(0, 10));
}

for (const [key, item] of Object.entries(rawData) as [string, any]) {
    const filteredItem : { [id: string]: any; } = {};
    for (const col of fields) {
        if (item.hasOwnProperty(col)) {
            filteredItem[col] = item[col];
        }
    }
    console.log(JSON.stringify(filteredItem));
    outputData.push(filteredItem);
}

log.info('Output dataset looks like this: ', outputData);

await Actor.pushData(outputData)

const csv = convertToCSV(outputData);

await Actor.setValue('OUTPUT', csv, {
    contentType: 'text/csv',
});

await Actor.exit()


function convertToCSV(data: Record<string, any>[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${(row[header] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ];
    return csvRows.join('\n');
}
