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
                console.log(error);
                callback(null, error);
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

    getLatestConversion: (conversionName, callback) => {
        databaseConnection.query("SELECT * FROM Conversions C1 WHERE C1.currencyFrom = ? AND C1.currencyTo = ? AND C1.createdAtTimestamp = (SELECT MAX(createdAtTimestamp) FROM Conversions C2 WHERE C1.currencyFrom = C2.currencyFrom AND C1.currencyTo = C2.currencyTo)", [conversionName.substring(0, 3), conversionName.substring(4)],function (error, result) {
            if (error) {
                callback(null, error);
                console.log(error);
                return;
            }

            result[0] ? callback(new Conversion(result[0].currencyFrom, result[0].currencyTo, result[0].rate, result[0].createdAtTimestamp, result[0].createdAtTimestamp, false), null) : callback(null, null);
        });
    },
};

module.exports = self;