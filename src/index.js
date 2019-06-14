const ErScraper = require("./core/erscraper");
const express = require('express');
const app = express();
const databaseService = require("./core/database_service");

const savedConversions = {};

function handleRequest(req, res) {
    const conversionName = req.originalUrl.toLowerCase().substring(1);

    // Get rid of duplicate conversion requests here since it is more effective than looping over the array.
    const multiQuery = [...new Set(conversionName.split("_"))];

    const conversionArray = [];
    const promiseArray = [];

    let notInSaved = false;
    let notTracking = false;

    for (const tuple of multiQuery) {
        const promise = ErScraper.trackTuple(tuple, res, conversionName, function () {
            const conversion = ErScraper.trackedConversions[tuple];

            // Add to conversion array if we already tracking. Rate may be null.
            if (conversion.rate !== null) {
                conversionArray.push(conversion);
            } else {
                if (tuple in savedConversions) {
                    conversionArray.push(savedConversions[tuple]);
                } else {
                    notInSaved = true;
                }
            }
        }, function (conversionName) {
            console.log("Not tracking: " + conversionName);

            if (tuple in savedConversions) {
                conversionArray.push(savedConversions[tuple]);
            } else {
                notTracking = true;
            }
        }, function (oldValue, newValue, conversionName) {
            if (oldValue !== newValue) {
                databaseService.insertConversion(ErScraper.trackedConversions[conversionName], function (result, error) {
                    savedConversions[conversionName] = ErScraper.trackedConversions[conversionName];
                    console.log(result);
                })
            }
        }, function (conversionName) {
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
}

function showTrackedCurrencies(res) {
    const conversionArray = [];

    for (const conversion of Object.values(ErScraper.trackedConversions)) {
        if (conversion.rate != null) {
            conversionArray.push(conversion);
        }
    }

    if (!conversionArray.length) {
        res.json({"state": "There aren't any tracked conversions."});
        return;
    }

    res.json(conversionArray);
}

function registerRoutes() {
    app.get('/', function (req, res) {
        res.json("ErScraper 0.1");
    });

    app.get('/tracking', function (req, res) {
        showTrackedCurrencies(res);
    });

    app.get('/*', function (req, res) {
        handleRequest(req, res);
    });
}

async function initializeServer() {
    const server = await app.listen(8080, function () {
        const host = server.address().address;
        const port = server.address().port;
        console.log("REST Server listening at http://%s:%s", host, port)
    });

    return server;
}

ErScraper.initialize().then(function (status) {
    if (status) {
        console.log("Scraper initialized successfully !");

        databaseService.getLatestConversions(function (result, error) {
            for (const conversion of result) {
                savedConversions[conversion.currencyFrom + "-" + conversion.currencyTo] = conversion;
            }
        });

        databaseService.getInvalidRoutes(function (result, error) {
            ErScraper.invalidRoutes = result;
        });

        registerRoutes();

        initializeServer().then(function (resolved) {
            console.log("REST Server started successfully !");
        }, function (rejected) {
            console.log("Error while initializing REST Server !");
        });
    } else { // We dont return false for now
        console.log("Scraper initialize failed !");
    }
}).catch(function (rejected) {
    console.log("Initialize failed with rejection: " + rejected);
});