const mysql = require("mysql2");

const db = mysql.createConnection(
    {
        host: '147.50.230.32',
        port:'3306',
        user:'root',
        password:'softdough@db',
        database:'softdough_sep'
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