# ErScraper
Real-time currency scraping REST service with Node.JS

Scrapes currency data from www.investing.com and tracks the currencies in realtime by observing the changes on the element #last_last which shows the currency rate. Investing automatically updates the rate, so we simply set an observer on the browser's JavaScript engine. Stores the conversions, their historical data and invalid routes (since we scrape currencies directly from the investing.com, we dont know which currencies actually exists, so to not waste some processing power for checking if page exists, we filter the requests by making sure that each currency conversion request endpoint consists of 7 letters total - e.g TRY-EUR - and for the endpoints like non-existing queries - e.g ABC - EUR - we check if page actually exists and if not we add it to an invalid routes HashMap and save it to a database so we do not need to check it next time) on a MySQL database. The scraper only starts to track the currencies when it gets a request containing that endpoint. When a request is made and if we have the currency saved on the database but not actively tracking, the server will return the most recent entry of that currency's data and will start to track the currency. The scraper is not aware of the server and server injects it's own modifications to the scraper (e.g when a currency gets started to tracked, the scraper executes the callback which is overriden by the server). Instead, server talks with the database and the scraper thus server collect's the data and provides the API endpoints.

# Database

```sql
CREATE DATABASE ErScraper;

USE ErScraper;

CREATE TABLE IF NOT EXISTS Conversions (
 currencyFrom varchar(3) NOT NULL,
 currencyTo varchar(3) NOT NULL,
 rate float(10) NOT NULL,
 createdAtTimestamp BIGINT(14) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 
ALTER TABLE Conversions ADD PRIMARY KEY (currencyFrom, currencyTo, createdAtTimestamp);

CREATE TABLE IF NOT EXISTS InvalidRoutes (
 route varchar(7) NOT NULL,
 createdAtTimestamp BIGINT(14) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE InvalidRoutes ADD PRIMARY KEY (route);
```

# Usage
Currently available API endpoints:

(GET) /all  : Returns all the tracked currencies and their data.

[![all.png](https://i.postimg.cc/4xd2HQ9b/all.png)](https://postimg.cc/hfk1HxMf)

(GET) /currency1-currency2 : Returns the up-to-date rate and the timestamp of the lastUpdate of the conversion CURRENCY1 to CURRENCY2.

[![currency1-currency2.png](https://i.postimg.cc/Y0CYDbkd/currency1-currency2.png)](https://postimg.cc/BLRjX5jF)

(GET) /currency1-currency2_currency3-currency4_... : Returns the conversions of the multiple currencies in one request. Different conversions are seperated by '_'.

[![currency1-currency2-currency3-currency4.png](https://i.postimg.cc/Z5t0CVgX/currency1-currency2-currency3-currency4.png)](https://postimg.cc/F7ph6ghx)
