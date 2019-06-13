const ErScraper = require("./src/core/erscraper");
const express = require('express');
const app = express();

function handleRequest(req, res) {
    const conversionName = req.originalUrl.toLowerCase().substring(1);

    // Get rid of duplicate conversion requests here since it is more effective than looping over the array.
    const multiQuery = [...new Set(conversionName.split("_"))];

    const conversionArray = [];
    const promiseArray = [];

    let notTracking = false;

    for (const tuple of multiQuery) {
        const promise = ErScraper.trackTuple(tuple, res, conversionName, function () {
            const conversion = ErScraper.trackedConversions[tuple];

            // Add to conversion array if we already tracking. Rate may be null.
            if (conversion.rate !== null) {
                conversionArray.push(conversion);
            }
        }, function () {
            notTracking = true;
        });

        promiseArray.push(promise);
    }

    Promise.all(promiseArray).then(function () { // To make sure callbacks are ran on trackTuple so notTracking is correct.
        if (notTracking) {
            res.json({"state": "Started tracking conversion(s), if the conversion(s) are valid you will see it when we finish our initial tracking."});
        } else {
            conversionArray.length === multiQuery.length ? res.json(conversionArray) : res.json({"state": "Conversion(s) are still loading, if the conversion(s) are valid you will see it when we finish our initial tracking."});
        }
    }).catch(function (reason) {
        res.json({"state": reason.toString().substring(7)});
    });
}

function registerRoutes() {
    app.get('/', function (req, res) {
        res.end("ErScraper 0.1");
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