const express = require('express');
const app = express();
const moment = require("moment/moment");
const databaseService = require("../core/database_service");
const erScraper = require("../core/erscraper");

const self = {
    savedConversions: {},

    handleRequest: (req, res) => {
        const conversionName = req.originalUrl.toLowerCase().substring(1);

        // Get rid of duplicate conversion requests here since it is more effective than looping over the array.
        const multiQuery = [...new Set(conversionName.split("_"))];

        const conversionArray = [];
        const promiseArray = [];

        let notInSaved = false;
        let notTracking = false;

        for (const tuple of multiQuery) {
            const promise = erScraper.trackTuple(tuple, res, conversionName, function () {
                const conversion = erScraper.trackedConversions[tuple];

                // Add to conversion array if we already tracking. Rate may be null.
                if (conversion.rate !== null) {
                    conversionArray.push(conversion);
                } else {
                    if (tuple in self.savedConversions) {
                        conversionArray.push(self.savedConversions[tuple]);
                    } else {
                        notInSaved = true;
                    }
                }
            }, function (conversionName) {
                console.log("Not tracking: " + conversionName);

                if (tuple in self.savedConversions) {
                    conversionArray.push(self.savedConversions[tuple]);
                } else {
                    notTracking = true;
                }
            }, function (oldValue, newValue, conversionName) {
                if (oldValue === null && newValue === null) {
                    // For the callback triggering the initial load (e.g after page.eval function returns the initial rate on the load)
                    // Check for the last record on the db for the conversion, if the rate is the same and the time diff is more than 1 min, insert new data
                    databaseService.getLatestConversion(conversionName, function (result, error) {
                        if (!error && !result) { // Got empty result from query
                            databaseService.insertConversion(erScraper.trackedConversions[conversionName], function (result, error) {
                                self.savedConversions[conversionName] = erScraper.trackedConversions[conversionName];
                                console.log(result);
                            });
                            return;
                        }

                        if (result.rate !== erScraper.trackedConversions[conversionName].rate || (result.rate === erScraper.trackedConversions[conversionName].rate && moment().valueOf() - result.createdAtTimestamp >= 60 * 1000)) {
                            databaseService.insertConversion(erScraper.trackedConversions[conversionName], function (result, error) {
                                self.savedConversions[conversionName] = erScraper.trackedConversions[conversionName];
                                console.log(result);
                            })
                        } else {
                            console.log("No need to insert. ");
                        }
                    });
                    return;
                }

                if (oldValue !== newValue) { // The !(oldValue && newValue) check is for the callback triggering the initial load (e.g after page.eval function returns)
                    console.log("2");

                    databaseService.insertConversion(erScraper.trackedConversions[conversionName], function (result, error) {
                        self.savedConversions[conversionName] = erScraper.trackedConversions[conversionName];
                        console.log(result);
                    })
                }
            },function (conversionName) {
                databaseService.insertInvalidRoute(conversionName, function (result, error) {
                    console.log(result);
                });
            });

            promiseArray.push(promise);
        }

        Promise.all(promiseArray).then(function () { // To make sure callbacks are ran on trackTuple so notTracking is correct.
            if (notInSaved) {
                res.json({"state": "Conversion(s) are still loading, if the conversion(s) are valid you will see it when we finish our initial tracking."});
            } else if (notTracking) {
                res.json({"state": "Started tracking conversion(s), if the conversion(s) are valid you will see it when we finish our initial tracking."});
            } else {
                res.json(conversionArray);
            }
        }).catch(function (reason) {
            res.json({"state": reason.toString().substring(7)});
        });
    },

    showTrackedCurrencies: (res) => {
        const conversionArray = [];

        for (const conversion of Object.values(erScraper.trackedConversions)) {
            if (conversion.rate != null) {
                conversionArray.push(conversion);
            }
        }

        if (!conversionArray.length) {
            res.json({"state": "There aren't any tracked conversions."});
            return;
        }

        res.json(conversionArray);
    },

    registerRoutes: () => {
        app.get('/', function (req, res) {
            res.json("ErScraper 0.1");
        });

        app.get('/tracking', function (req, res) {
            self.showTrackedCurrencies(res);
        });

        app.get('/*', function (req, res) {
            self.handleRequest(req, res);
        });
    },

    initializeServer: async () => {
        databaseService.getLatestConversions(function (result, error) {
            for (const conversion of result) {
                self.savedConversions[conversion.currencyFrom + "-" + conversion.currencyTo] = conversion;
            }
        });

        databaseService.getInvalidRoutes(function (result, error) {
            erScraper.invalidRoutes = result;
        });

        const server = await app.listen(8080, function () {
            const host = server.address().address;
            const port = server.address().port;
            console.log("REST Server listening at http://%s:%s", host, port)
        });

        return server;
    },
};

module.exports = self;