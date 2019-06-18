const erScraper = require("./core/erscraper");
const server = require("./core/server");

erScraper.initialize().then(function (status) {
    if (status) {
        console.log("Scraper initialized successfully !");

        server.registerRoutes();

        server.initializeServer().then(function (resolved) {
            console.log("REST Server started successfully !");
        }, function (rejected) {
            console.log("Error while initializing REST Server !");
        });
    } else {
        console.log("Scraper initialize failed !");
    }
}).catch(function (rejected) {
    console.log("Initialize failed with rejection: " + rejected);
});