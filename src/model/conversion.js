module.exports = class Conversion {
    constructor(currencyFrom, currencyTo, rate, createdAtTimestamp, lastUpdateTimestamp, isTracking) {
        this._currencyFrom = currencyFrom;
        this._currencyTo = currencyTo;
        this._rate = rate;
        this._createdAtTimestamp = createdAtTimestamp;
        this._lastUpdateTimestamp = lastUpdateTimestamp;
        this._isTracking = isTracking;
    }

    get isTracking() {
        return this._isTracking;
    }

    set isTracking(isTracking) {
        this._isTracking = isTracking;
    }

    get createdAtTimestamp() {
        return this._createdAtTimestamp;
    }

    set createdAtTimestamp(createdAtTimestamp) {
        this._createdAtTimestamp = createdAtTimestamp;
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