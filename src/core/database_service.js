const moment = require("moment/moment");
const databaseConnection = require('./database.js');
const Conversion = require("../model/conversion.js");

const self = {
    getLatestConversions: (callback) => {
        databaseConnection.query("SELECT * FROM Conversions C1 WHERE C1.createdAtTimestamp = (SELECT MAX(createdAtTimestamp) FROM Conversions C2 WHERE C1.currencyFrom = C2.currencyFrom AND C1.currencyTo = C2.currencyTo)", function (error, result) {
            if (error) {
                callback(null, error);
                console.log(error);
                return;
            }

            const conversionArray = [];

            for (const data of result) {
                conversionArray.push(new Conversion(data.currencyFrom, data.currencyTo, data.rate, data.createdAtTimestamp, data.createdAtTimestamp, false));
            }

            callback(conversionArray, null);
        });
    },

    insertConversion: (conversion, callback) => {
        databaseConnection.query("INSERT INTO Conversions SET Conversions.currencyFrom = ?, Conversions.currencyTo = ?, Conversions.rate = ?, Conversions.createdAtTimestamp = ?", [conversion.currencyFrom, conversion.currencyTo, conversion.rate, conversion.lastUpdateTimestamp], function (error, result) {
            if (error) {
                callback(null, error);
                console.log(error);
                return;
            }

            callback(result, null);
        });
    },

    insertInvalidRoute: (route, callback) => {
        databaseConnection.query("INSERT INTO InvalidRoutes SET InvalidRoutes.route  = ?, InvalidRoutes.createdAtTimestamp  = ?", [route, moment().valueOf()], function (error, result) {
            if (error) {
                callback(null, error);
                console.log(error);
                return;
            }

            callback(result, null);
        });
    },

    getInvalidRoutes: (callback) => {
        databaseConnection.query("SELECT InvalidRoutes.route FROM InvalidRoutes", function (error, result) {
            if (error) {
                callback(null, error);
                console.log(error);
                return;
            }

            const invalidRoutes = [];

            for (const data of result) {
                invalidRoutes.push(data.route);
            }

            callback(invalidRoutes, null);
        });
    },
};

module.exports = self;