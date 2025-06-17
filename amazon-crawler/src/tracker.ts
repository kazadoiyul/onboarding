import {log} from "crawlee";
import {stringify} from "node:querystring";

class Tracker {
    private state: {[key: string] : number}
    constructor() {
        this.state = {}
        setInterval(() => console.log(stringify(this.state)), 10000);
    }

    updateCount(asin: string) {
        if (this.state[asin] === undefined) {
            this.state[asin] = 0;
        }
        this.state[asin] += 1
    }
}

export const tracker = new Tracker();
