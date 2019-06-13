const Conversion = require("../model/conversion.js");
const puppeteer = require('puppeteer');
const moment = require("moment/moment");

const self = {
    browser: null,

    trackedConversions: {},
    invalidRoutes: [],

    baseURL: "https://investing.com/currencies/",
    rateElementID: 'last_last',

    launchBrowser: async () => {
        console.log("Launching browser.");
        self.browser = await puppeteer.launch({headless: true});
        console.log("Browser is up");
    },

    scrapeLivePrice: async (currencyFrom, currencyTo, conversionName) => {
        self.trackedConversions[conversionName] = new Conversion(currencyFrom, currencyTo, null);

        console.log("Creating new tab.");
        const page = await self.browser.newPage();

        console.log("Setting viewport.");
        await page.setViewport({width: 1920, height: 926});

        console.log("Going to target page.");
        const response = await page.goto(self.baseURL + conversionName);

        if (response.status() === 404) {
            console.log("404 on target page.");
            delete self.trackedConversions[conversionName];
            await page.close();
            return false; // instead throw error ?
        }

        console.log("Target page loaded.");

        await page.exposeFunction('livePriceChangeCallback', self.livePriceChangeCallback);

        self.trackedConversions[conversionName].rate = await page.evaluate((conversionName, rateElementID) => {
            // Observe text change on currency rate
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    self.livePriceChangeCallback(mutation.removedNodes[0].textContent, mutation.addedNodes[0].textContent, conversionName);
                }
            });

            observer.observe(document.getElementById(rateElementID), {childList: true});

            return document.getElementById(rateElementID).innerText;
        }, conversionName, self.rateElementID);

        self.trackedConversions[conversionName].lastUpdateTimestamp = await moment().valueOf();

        return true;
    },

    livePriceChangeCallback: (oldValue, newValue, conversionName) => {
        if (oldValue !== newValue) {
            console.log(`Change in ${conversionName} rate ! ${oldValue} -> ${newValue}`);
            self.trackedConversions[conversionName].rate = newValue;
            self.trackedConversions[conversionName].lastUpdateTimestamp = moment().valueOf();
        }
    },

    trackTuple: async (tuple, res, req, inTrackedConversionsCallback, notTrackingCallback) => {
        // Currencies must be 3 letters according to ISO standard.
        if (tuple.length !== 7 || self.invalidRoutes.includes(tuple)) {
            throw new Error("Currency does not exists !");
        }

        const query = tuple.split("-");

        const currencyFrom = query[0];
        const currencyTo = query[1];

        if (tuple in self.trackedConversions) {
            inTrackedConversionsCallback();
        } else {
            self.scrapeLivePrice(currencyFrom, currencyTo, tuple).then(function (exists) {
                if (!exists) { // We got 404, no need to check for this route again, just show not exists in json.
                    self.invalidRoutes.push(tuple);
                }
            }).catch(function (reject) {
                console.log(reject + " reject !");
                return false;
            });

            notTrackingCallback();
        }

        return true;
    },

    initialize: async () => {
        await self.launchBrowser();

        return true;
    },
};

module.exports = self;