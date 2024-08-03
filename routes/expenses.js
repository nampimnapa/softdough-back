const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')

//ยังไม่เทส

router.post('/addtype',(req, res, next) => {
    let type = req.body;
    query = "insert into expensesType (ept_name) values(?)";
    connection.query(query, [type.ept_name], (err, results) => {
        if (!err) {
            return res.status(200).json({ message: "success" });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
})

router.get('/readtype', (req, res, next) => {
    var query = 'select *from expensesType'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

router.patch('/updatetype/:ept_id',(req, res, next) => {
    const ept_id = req.params.ept_id;
    const type = req.body;
    var query = "UPDATE expensesType SET ept_name=? WHERE ept_id=?";
    connection.query(query, [type.ept_name, ept_id], (err, results) => {
        if (!err) {
            if (results.affectedRows === 0) {
                console.error(err);
                return res.status(404).json({ message: "id does not found" });
            }
            return res.status(200).json({ message: "update success" });
        } else {
            return res.status(500).json(err);
        }
    });
});

// router.post('/add', isAdminUserOrder, (req, res, next) => {
//     let expensesData = req.body;
//     const userId = req.session.st_id; // ดึง user_id จาก session

//     const query = `
//         INSERT INTO expenses (ep_sum, ep_note, ep_status, ept_id, ep_date, user_id)
//         VALUES (?, ?, ?, ?, ?, ?);
//     `;
//     const values = [
//         expensesData.ep_sum,
//         expensesData.ep_note,
//         expensesData.ep_status,
//         expensesData.ept_id,
//         expensesData.ep_date,
//         userId, // ใช้ user_id ที่ดึงจาก session
//     ];

//     connection.query(query, values, (err, results) => {
//         if (!err) {
//             return res.status(200).json({ message: "success" });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });

router.post('/add', isAdminUserOrder, (req, res, next) => {
    let expensesData = req.body;
    const userId = req.session.st_id; // ดึง user_id จาก session
    console.log('Session:', req.session); // Check session data
    console.log('Body:', req.body); // Check request body
    if (!userId) {
        return res.status(403).json({ message: 'Access Forbidden: No user ID found in session' });
    }

    const query = `
        INSERT INTO expenses (ep_sum, ep_note, ep_status, ept_id, ep_date, user_id)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [
        expensesData.ep_sum,
        expensesData.ep_note,
        expensesData.ep_status,
        expensesData.ept_id,
        expensesData.ep_date,
        userId, // ใช้ user_id ที่ดึงจาก session
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




module.exports = router;