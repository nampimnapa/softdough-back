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

router.post('/circulating_money', isAdmin, (req, res, next) => {
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

//ordertype
router.get('/price', (req, res, next) => {
    const query = `
    SELECT 
        sm.sm_id, 
        sm.sm_name, 
        sm.smt_id, 
        sm.sm_price, 
        smt.smt_name
    FROM 
        salesmenu sm
        JOIN salesmenutype smt ON sm.smt_id = smt.smt_id
    `;

    const detailQuery = `
    SELECT 
        otd.sm_id, 
        otd.odt_id AS detail_odt_id, 
        ot.odt_name, 
        otd.odtd_price
    FROM 
        orderstypedetail otd
        JOIN orderstype ot ON otd.odt_id = ot.odt_id
    `;

    connection.query(query, (err, menuResults) => {
        if (err) {
            console.error("MySQL Query Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        connection.query(detailQuery, (err, detailResults) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ message: "error", error: err });
            }

            // Create a map for quick lookup of details by sm_id
            const detailsMap = {};
            detailResults.forEach(detail => {
                if (!detailsMap[detail.sm_id]) {
                    detailsMap[detail.sm_id] = [];
                }
                detailsMap[detail.sm_id].push({
                    [`odt_id${detail.detail_odt_id}`]: detail.detail_odt_id,
                    [`odt_name${detail.detail_odt_id}`]: detail.odt_name,
                    [`odtd_price${detail.detail_odt_id}`]: detail.odtd_price
                });
            });

            // Add pricedeli to menu results
            const formattedResults = menuResults.map(menu => {
                return {
                    ...menu,
                    pricedeli: detailsMap[menu.sm_id] && detailsMap[menu.sm_id].length > 0
                        ? detailsMap[menu.sm_id]
                        : "ไม่มีข้อมูล"
                };
            });

            return res.status(200).json(formattedResults);
        });
    });
});


router.get('/ordertype', (req, res, next) => {
    var q = 'select * from orderstype where deleted_at is null'
    connection.query(q, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

// router.post('/addordertype', (req, res, next) => {
//     let type = req.body;
//     // console.log('Body:', req.body); // Check request body

//     const query = `
//         INSERT INTO ordersType (odt_id, odt_name, odt_per ,deleted_at)
//         VALUES (?, ?, ?, ?);
//     `;
//     const values = [
//         type.odt_id,
//         type.odt_name,
//         type.odt_per,
//         null
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

//ใหม่
router.post('/addordertype', (req, res, next) => {
    const { odt_id, odt_name, odt_per, priceup, detail } = req.body;

    // เพิ่มข้อมูลใน ordersType
    const insertOrderTypeQuery = `
        INSERT INTO orderstype (odt_id, odt_name, odt_per, deleted_at)
        VALUES (?, ?, ?, ?);
    `;
    const orderTypeValues = [
        odt_id,
        odt_name,
        odt_per,
        null
    ];

    connection.query(insertOrderTypeQuery, orderTypeValues, (err, results) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        // ถ้าเพิ่มข้อมูลใน ordersType สำเร็จ
        // วนลูปเพื่อเพิ่มข้อมูลใน ordersTypeDetail
        let detailInsertQuery = `
            INSERT INTO orderstypedetail (sm_id, odt_id, odtd_price, deleted_at)
            VALUES (?, ?, ?, null);
        `;

        detail.forEach(item => {
            const odtd_price = item.sm_price + priceup;
            const detailValues = [
                item.sm_id,
                odt_id,  // อ้างอิง odt_id จากที่เพิ่มใน ordersType
                odtd_price
            ];

            connection.query(detailInsertQuery, detailValues, (err, results) => {
                if (err) {
                    console.error("MySQL Error (Detail):", err);
                    return res.status(500).json({ message: "error", error: err });
                }
            });
        });

        // ส่ง response กลับหลังจากเพิ่มข้อมูลสำเร็จ
        return res.status(200).json({ message: "success" });
    });
});

//แก้ไขราคาหน้าร้านบางฟิล
router.patch('/updateprices', (req, res) => {
    const prices = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
        return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
    }

    const updateQueries = prices.map(priceObj => {
        const query = 'UPDATE salesmenu SET sm_price = ?, updated_at = current_timestamp() WHERE sm_id = ?';
        const values = [priceObj.price, priceObj.sm_id];
        console.log(query, values); // พิมพ์ query และค่าออกมาดู
        return {
            query,
            values
        };
    });

    Promise.all(updateQueries.map(q => {
        return new Promise((resolve, reject) => {
            connection.query(q.query, q.values, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }))
    .then(() => res.status(200).json({ message: 'อัปเดตราคาสำเร็จ' }))
    .catch(err => {
        console.error('ข้อผิดพลาด MySQL:', err);
        res.status(500).json({ message: 'ข้อผิดพลาดในการอัปเดตราคา', error: err });
    });
});

//แก้ไขราคาเดลิบางฟิล
router.patch('/updatepricesdeli', (req, res) => {
    const prices = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
        return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
    }
    console.log(prices,"prices")
    
    const updateOrInsertQueries = prices.map(priceObj => {
        const checkExistQuery = 'SELECT COUNT(*) AS count FROM orderstypedetail WHERE sm_id = ? AND odt_id = ?';
        const checkValues = [priceObj.sm_id, priceObj.odt_id];

        return new Promise((resolve, reject) => {
            // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
            connection.query(checkExistQuery, checkValues, (err, results) => {
                if (err) return reject(err);

                const exists = results[0].count > 0;
                if (exists) {
                    // ถ้ามีอยู่แล้ว อัปเดตราคา
                    const updateQuery = 'UPDATE orderstypedetail SET odtd_price = ?, updated_at = current_timestamp() WHERE sm_id = ? AND odt_id = ?';
                    const updateValues = [priceObj.price, priceObj.sm_id, priceObj.odt_id];
                    connection.query(updateQuery, updateValues, (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                } else {
                    // ถ้าไม่มี เพิ่มข้อมูลใหม่
                    const insertQuery = 'INSERT INTO orderstypedetail (sm_id, odt_id, odtd_price, deleted_at) VALUES (?, ?, ?, null)';
                    const insertValues = [priceObj.sm_id, priceObj.odt_id, priceObj.price];
                    connection.query(insertQuery, insertValues, (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                }
            });
        }); 
    });

    Promise.all(updateOrInsertQueries)
    .then(() => res.status(200).json({ message: 'อัปเดตราคาสำเร็จ' }))
    .catch(err => {
        console.error('ข้อผิดพลาด MySQL:', err);
        res.status(500).json({ message: 'ข้อผิดพลาดในการอัปเดตราคา', error: err });
    });
});

//เดลิ แก้ไขทุกตัว ยังไม่เทสแล้วก็ไม่รองรับ ตัวที่ยังไม่มีข้อมูล
//อาจจะให้ไปเพิ่มก่อน คือทำอันแก้ไขราคาบางตัว แล้วเลืแกแก้อันนั้น
router.patch('/updatepriceswithincrement', (req, res) => {
    const { priceup, detail } = req.body;

    if (typeof priceup !== 'number' || !Array.isArray(detail) || detail.length === 0) {
        return res.status(400).json({ message: 'Invalid data format' });
    } 

    const updatePromises = detail.map(item => {
        return new Promise((resolve, reject) => {
            // First, check if the record exists
            const checkQuery = 'SELECT * FROM orderstypedetail WHERE sm_id = ? AND odt_id = ?';
            const checkValues = [item.sm_id, item.odt_id];

            connection.query(checkQuery, checkValues, (err, results) => {
                if (err) return reject(err);

                if (results.length > 0) {
                    // If the record exists, update it
                    const newPrice = item.price + priceup;
                    const updateQuery = 'UPDATE orderstypedetail SET odtd_price = ?, updated_at = current_timestamp() WHERE sm_id = ? AND odt_id = ?';
                    const updateValues = [newPrice, item.sm_id, item.odt_id];

                    connection.query(updateQuery, updateValues, (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                } else {
                    // If the record does not exist, insert a new one
                    // อาจไม่ต้องมี
                    const newPrice = item.price + priceup;
                    const insertQuery = 'INSERT INTO orderstypedetail (sm_id, odt_id, odtd_price, deleted_at) VALUES (?, ?, ?, null)';
                    const insertValues = [item.sm_id, item.odt_id, newPrice];

                    connection.query(insertQuery, insertValues, (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                }
            });
        });
    });

    Promise.all(updatePromises)
        .then(() => res.status(200).json({ message: 'Prices updated successfully' }))
        .catch(err => {
            console.error('MySQL Error:', err);
            res.status(500).json({ message: 'Error updating prices', error: err });
        });
});

//ทุกตัว หน้าร้าน
router.patch('/updatepricesallup', (req, res) => {
    const {detail,priceup} = req.body;

    if (!Array.isArray(detail) || detail.length === 0) {
        return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
    }

    const updateQueries = detail.map(priceObj => {
        const query = 'UPDATE salesmenu SET sm_price = ?, updated_at = current_timestamp() WHERE sm_id = ?';
        const newPrice = Number(priceObj.price) + priceup;

        const values = [newPrice, priceObj.sm_id];
        console.log(query, values); // พิมพ์ query และค่าออกมาดู
        return {
            query,
            values
        };
    });

    Promise.all(updateQueries.map(q => {
        return new Promise((resolve, reject) => {
            connection.query(q.query, q.values, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }))
    .then(() => res.status(200).json({ message: 'อัปเดตราคาสำเร็จ' }))
    .catch(err => {
        console.error('ข้อผิดพลาด MySQL:', err);
        res.status(500).json({ message: 'ข้อผิดพลาดในการอัปเดตราคา', error: err });
    });
});

module.exports = router;