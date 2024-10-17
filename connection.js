const mysql = require("mysql2");
require('dotenv').config();

const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const database = process.env.DATABASE_NAME;

// โค้ดเดิมที่ทำมา ทำให้ Database ตัดการเชื่อมต่อ ไม่รองรับการเชื่อมต่อหลาย ๆ ทาง จนทำให้ระบบล่มในที่สุด
// จะต้องใช้ Async/Await ในการจัดการกับการเรียกใช้ฐานข้อมูล
// const db = mysql.createConnection(
//     {
//         host: host,
//         port: port,
//         user: user,
//         password:password,
//         database: database
//     }
// );


// db.connect((err) => {
//     if (err) {
//         console.error("Connection failed. Error:", err);
//     } else {
//         console.log("Connection successful.");
//     }
// });

const pool = mysql.createPool({
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});


// const db = pool.promise();


pool.getConnection((err, connection) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        return;
    }
    console.log("Successfully connected to the database.");
    connection.release();
});

module.exports = pool;