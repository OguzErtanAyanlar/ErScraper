# ErScraper
Real-time currency scraping REST service with Node.JS

Scrapes currency data from www.investing.com and tracks the currencies in realtime by observing the changes on the element #last_last which shows the currency rate. Investing automatically updates the rate, so we simply set an observer on the browser's js engine. 

# Usage
Currently available endpoints:

(GET) /all  : Returns all the tracked currencies and their data.
(GET) /currency1-currency2 : Returns the up-to-date rate and the timestamp of the lastUpdate of the conversion CURRENCY1 to CURRENCY2.
(GET) /currency1-currency2_currency3-currency4_... : Returns the conversions of the multiple currencies in one request. Different conversions are seperated by '_'.
