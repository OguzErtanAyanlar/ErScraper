module.exports = class Conversion {
    constructor(currencyFrom, currencyTo, rate, lastUpdateTimestamp) {
        this._currencyFrom = currencyFrom;
        this._currencyTo = currencyTo;
        this._rate = rate;
        this._lastUpdateTimestamp = lastUpdateTimestamp;
    }

    get currencyFrom() {
        return this._currencyFrom;
    }

    set currencyFrom(currencyFrom) {
        this._currencyFrom = currencyFrom;
    }

    get currencyTo() {
        return this._currencyTo;
    }

    set currencyTo(currencyTo) {
        this._currencyTo = currencyTo;
    }

    get rate() {
        return this._rate;
    }

    set rate(rate) {
        this._rate = rate;
    }

    get lastUpdateTimestamp() {
        return this._lastUpdateTimestamp;
    }

    set lastUpdateTimestamp(lastUpdateTimestamp) {
        this._lastUpdateTimestamp = lastUpdateTimestamp;
    }
};