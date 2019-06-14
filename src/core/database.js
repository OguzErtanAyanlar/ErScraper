const mysql = require('mysql');

const databaseConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ErScraper'
});

databaseConnection.connect(function(err) {
    if (err) throw err;
});

module.exports = databaseConnection;