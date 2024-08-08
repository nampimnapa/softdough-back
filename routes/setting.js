const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')

router.post('/addaddreess', (req, res, next) => {
    let Data = req.body;
    console.log('Body:', req.body); // Check request body

    const query = `
        INSERT INTO shop (sh_name, sh_address, sh_tel, sh_province, sh_district,sh_ampher,sh_zipcode,deleted_at)
        VALUES (?, ?, ?, ?, ?,?,?,?);
    `;
    const values = [
        Data.sh_name,
        Data.sh_address,
        Data.sh_tel,
        Data.sh_province,
        Data.sh_district,
        Data.sh_ampher,
        Data.sh_zipcode,
        null
    ];

    connection.query(query, values, (err, results) => {
        if (!err) {
            return res.status(200).json({ message: "success" });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
});

router.get('/address', (req, res, next) => {
    var query = 'select * from shop'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

router.post('/circulating_money',isAdmin, (req, res, next) => {
    let Data = req.body;
    const userId = req.session.st_id; // ดึง user_id จาก session
    if (!userId) {
        return res.status(403).json({ message: 'Access Forbidden: No user ID found in session' });
    }
    // Check if there's already an entry for today
    const checkQuery = `
        SELECT cm_id FROM circulating_money 
        WHERE DATE(created_at) = CURDATE() AND user_id = ?;
    `;

    connection.query(checkQuery, [userId], (err, results) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "A record for today already exists." });
        } else {
            // Insert data into circulating_money
            const insertQuery = `
                INSERT INTO circulating_money (\`change\`, user_id)
                VALUES (?, ?);
            `;
            const values = [
                Data.change,
                userId
            ];

            connection.query(insertQuery, values, (err, results) => {
                if (err) {
                    console.error("MySQL Error:", err);
                    return res.status(500).json({ message: "error", error: err });
                }
                return res.status(200).json({ message: "success" });
            });
        }
    });
});

router.get('/circulating_money', (req, res, next) => {
    var query = `select circulating_money.*,
                DATE_FORMAT(circulating_money.created_at, '%d-%m-%Y') AS created_at
                FROM circulating_money
                ORDER BY circulating_money.created_at DESC ;
    `
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})


module.exports = router;