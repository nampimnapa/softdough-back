const mysql = require("mysql2");
require('dotenv').config();

const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const database = process.env.DATABASE_NAME;

const db = mysql.createConnection(
    {
        host: host,
        port: port,
        user: user,
        password:password,
        database: database
        // database:'softdough'
    }
);


// localhost
// const db = mysql.createConnection(
//     {
//         host: '127.0.0.1',
//         port:'3306',
//         user:'root',
//         password:'',
//         database:'softdough_sep'
//         // database:'softdough'
//     }
// );

db.connect((err) => {
    if (err) {
        console.error("Connection failed. Error:", err);
    } else {
        console.log("Connection successful.");
    }
});

module.exports = db;