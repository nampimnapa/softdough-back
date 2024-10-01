const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')


router.post('/addtype', (req, res, next) => {
    let type = req.body;
    query = "insert into expensestype (ept_name) values(?)";
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
    var query = 'select * from expensestype'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

router.patch('/updatetype/:ept_id', (req, res, next) => {
    const ept_id = req.params.ept_id;
    const type = req.body;
    var query = "UPDATE expensestype SET ept_name=? WHERE ept_id=?";
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
    const userIdt = req.session.st_type; // ดึง user_id จาก session

    console.log('Session:', req.session); // Check session data
    console.log('Body:', req.body); // Check request body
    if (!userId) {
        return res.status(403).json({ message: 'Access Forbidden: No user ID found in session' });
    }
    if (userIdt === '0') {
        // return res.status(403).json({ message: 'Access Forbidden: No user ID found in session' });
        const query = `
        INSERT INTO expenses (ep_sum, ep_note, ep_status, ept_id, ep_date, user_id,deleted_at)
        VALUES (?, ?, ?, ?, ?, ?,?);
    `;
        const values = [
            expensesData.ep_sum,
            expensesData.ep_note,
            expensesData.ep_status,
            expensesData.ept_id,
            expensesData.ep_date,
            userId, // ใช้ user_id ที่ดึงจาก session
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
    }
    else if (userIdt === '2' ) {
        const query = `
        INSERT INTO expenses (ep_sum, ep_note, ep_status, ept_id, ep_date, user_id,deleted_at)
        VALUES (?, ?, ?, ?, ?, ?,?);
    `;
        const values = [
            expensesData.ep_sum,
            expensesData.ep_note,
            1,
            expensesData.ept_id,
            expensesData.ep_date,
            userId, // ใช้ user_id ที่ดึงจาก session
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
    }
});


router.get('/readall', (req, res, next) => {
    // Example of how to handle authorization
    console.log('Session data:', req.session); // Debug session data

    var query = `
    SELECT 
        ep.*,
        DATE_FORMAT(ep.ep_date, '%d-%m-%Y') AS ep_date,
        FORMAT(ep.ep_sum, 0) AS ep_sum_formatted,
        ept.ept_name AS ept_name,
        st.st_name AS st_name
    FROM 
        expenses AS ep
    JOIN 
        expensestype AS ept ON ept.ept_id = ep.ept_id 
    JOIN 
        staff AS st ON st.st_id = ep.user_id
    WHERE 
        ep.deleted_at IS NULL and ep.ep_status = 2
    ORDER BY ep.ep_date DESC ;
        `
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

router.get('/readstatus', (req, res, next) => {
    // Example of how to handle authorization
    console.log('Session data:', req.session); // Debug session data

    var query = `
   SELECT 
       ep.*,
       DATE_FORMAT(ep.ep_date, '%d-%m-%Y') AS ep_date,
       FORMAT(ep.ep_sum, 0) AS ep_sum_formatted,
       ept.ept_name AS ept_name,
       st.st_name AS st_name
   FROM 
       expenses AS ep
   JOIN 
       expensestype AS ept ON ept.ept_id = ep.ept_id 
   JOIN 
       staff AS st ON st.st_id = ep.user_id
   WHERE 
       ep.deleted_at IS NULL and ep.ep_status = 1;
       `
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

//เปลี่ยนสเตตัส อนุมัติ 
router.patch('/updateStatus/:id', (req, res, next) => {
    const ep_id = req.params.id;

    const Query = "UPDATE expenses SET ep_status = 2 WHERE ep_id  = ?";
    connection.query(Query, [ep_id], (err, result) => {
        if (err) {
            console.error("MySQL Error", err);
            return res.status(500).json({ message: "error", error: err });
        }
        res.status(200).json({ message: "expenses ep_status = 2" });

    });
});


//ไม่อนุมัติ 
router.patch('/deleted/:id', (req, res, next) => {
    const ep_id = req.params.id;

    const Query = "UPDATE expenses SET deleted_at = CURRENT_TIMESTAMP WHERE ep_id  = ?";
    connection.query(Query, [ep_id], (err, result) => {
        if (err) {
            console.error("MySQL Error", err);
            return res.status(500).json({ message: "error", error: err });
        }
        res.status(200).json({ message: "expenses deleted" });

    });
});

// สร้างฟังก์ชันคำนวณเอา
//เหลือพวกคำนวณตั่งต่าง


//dashbord ปกติ
// router.get('/readalldash', (req, res, next) => {
//     console.log('Session data:', req.session); // Debug session data

//     var query = `
//     SELECT 
//         ept.ept_id,
//         ept.ept_name,
//         SUM(ep.ep_sum) AS total_sum, 
//         COUNT(ep.ep_id) AS total_count,
//         GROUP_CONCAT(DATE_FORMAT(ep.ep_date, '%d-%m-%Y')) AS dates,
//         GROUP_CONCAT(FORMAT(ep.ep_sum, 0)) AS formatted_sums
//     FROM 
//         expenses AS ep
//     JOIN 
//         expensesType AS ept ON ept.ept_id = ep.ept_id 
//     WHERE 
//         ep.deleted_at IS NULL 
//         AND ep.ep_status = 2
//     GROUP BY 
//         ept.ept_id, ept.ept_name
//     ORDER BY 
//         total_sum DESC;  -- เรียงตามยอดรวมจากมากไปน้อย
//     `;

//     connection.query(query, (err, results) => {
//         if (!err) {
//             return res.status(200).json(results);
//         } else {
//             return res.status(500).json(err);
//         }
//     });
// });

// ลองเดือน
router.get('/readalldash', (req, res, next) => {
    const { month } = req.query; // รับค่า month จาก query string
    const [year, monthNumber] = month.split('-');

    var query = `
    SELECT 
        ept.ept_name,
        SUM(ep.ep_sum) AS total_sum
    FROM 
        expenses AS ep
    JOIN 
        expensestype AS ept ON ept.ept_id = ep.ept_id 
    WHERE 
        ep.deleted_at IS NULL 
        AND ep.ep_status = 2 
        AND YEAR(ep.ep_date) = ? 
        AND MONTH(ep.ep_date) = ?
    GROUP BY 
        ept.ept_name;
    `;

    connection.query(query, [year, monthNumber], (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});

module.exports = router;