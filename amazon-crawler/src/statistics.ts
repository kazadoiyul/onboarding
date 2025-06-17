import {Actor} from "apify";

class Statistics {
    private state: { errors: {[url: string]: string[]}; totalSaved: number };
    constructor() {
        this.state = {
            errors: {},
            totalSaved: 0,
        };
    }

    async init () {
        const data = await Actor.getValue('STATS');
        if (data) this.state = data as { errors: {}; totalSaved: number };

        Actor.on('persistState', async () => {
            await Actor.setValue('STATS', this.state);
        });

        setInterval(() => console.log(this.state), 10000);
    }

    addToErrors(source: string, errorMessage: string) : void {
        if (!this.state.errors?.[source]) this.state.errors[source] = [];
        this.state.errors[source].push(errorMessage);
    }

    success(): void {
        this.state.totalSaved += 1;
    }

}

export const stats = new Statistics();

