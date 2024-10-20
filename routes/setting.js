const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')

router.post('/addaddreess', async (req, res, next) => {
    const data = req.body;
    console.log('Body:', data); // Log request body
    const db = connection.promise();
    const query = `
        INSERT INTO shop (sh_name, sh_address, sh_tel, sh_province, sh_district, sh_ampher, sh_zipcode, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
        data.sh_name,
        data.sh_address,
        data.sh_tel,
        data.sh_province,
        data.sh_district,
        data.sh_ampher,
        data.sh_zipcode,
        null
    ];

    try {
        const [result] = await db.query(query, values);
        console.log('Insert result:', result); // Log insert result
        return res.status(201).json({ 
            message: "Address added successfully", 
            insertId: result.insertId 
        });
    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ 
            message: "An error occurred while adding the address", 
            error: err.message 
        });
    }
});

router.get('/address', async (req, res, next) => {
    const query = 'SELECT * FROM shop';

    try {
        const db = connection.promise();
        const [results] = await db.query(query);
        return res.status(200).json(results);
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
            message: "An error occurred while fetching shop addresses",
            error: err.message
        });
    }
});

router.post('/circulating_money', isAdmin, async (req, res, next) => {
    const data = req.body;
    const userId = req.session.st_id;

    if (!userId) {
        return res.status(403).json({ message: 'Access Forbidden: No user ID found in session' });
    }

    try {
        // Check if there's already an entry for today
        const db = connection.promise();
        const checkQuery = `
            SELECT cm_id FROM circulating_money 
            WHERE DATE(created_at) = CURDATE() AND user_id = ?;
        `;
        const [existingEntries] = await db.query(checkQuery, [userId]);

        if (existingEntries.length > 0) {
            return res.status(400).json({ message: "A record for today already exists." });
        }

        // Insert data into circulating_money
        const insertQuery = `
            INSERT INTO circulating_money (\`change\`, user_id)
            VALUES (?, ?);
        `;
        const [insertResult] = await db.query(insertQuery, [data.change, userId]);

        return res.status(200).json({ 
            message: "success", 
            insertId: insertResult.insertId 
        });

    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ 
            message: "An error occurred while processing your request", 
            error: err.message 
        });
    }
});

router.get('/circulating_money', async (req, res, next) => {
    const query = `
        SELECT circulating_money.*,
        DATE_FORMAT(circulating_money.created_at, '%d-%m-%Y') AS created_at
        FROM circulating_money
        ORDER BY circulating_money.created_at DESC
    `;

    try {
        const db = connection.promise();
        const [results] = await db.query(query);
        return res.status(200).json(results);
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
            message: "An error occurred while fetching circulating money data",
            error: err.message
        });
    }
});

//ordertype
router.get('/price', async (req, res, next) => {
    const menuQuery = `
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


    try {
        const db = connection.promise();
        const [menuResults] = await db.query(menuQuery);
        const [detailResults] = await db.query(detailQuery);

        // Create a map for quick lookup of details by sm_id
        const detailsMap = detailResults.reduce((acc, detail) => {
            if (!acc[detail.sm_id]) {
                acc[detail.sm_id] = [];
            }
            acc[detail.sm_id].push({
                [`odt_id${detail.detail_odt_id}`]: detail.detail_odt_id,
                [`odt_name${detail.detail_odt_id}`]: detail.odt_name,
                [`odtd_price${detail.detail_odt_id}`]: detail.odtd_price
            });
            return acc;
        }, {});

        // Add pricedeli to menu results
        const formattedResults = menuResults.map(menu => ({
            ...menu,
            pricedeli: detailsMap[menu.sm_id] && detailsMap[menu.sm_id].length > 0
                ? detailsMap[menu.sm_id]
                : "ไม่มีข้อมูล"
        }));

        return res.status(200).json(formattedResults);

    } catch (err) {
        console.error("Database Query Error:", err);
        return res.status(500).json({ 
            message: "An error occurred while fetching price data", 
            error: err.message 
        });
    }
});


router.get('/ordertype', async (req, res, next) => {
    const query = 'SELECT * FROM orderstype WHERE deleted_at IS NULL';

    try {
        const db = connection.promise();
        const [results] = await db.query(query);
        return res.status(200).json(results);
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
            message: "An error occurred while fetching order types",
            error: err.message
        });
    }
});


//ใหม่
router.post('/addordertype', async (req, res, next) => {
    const { odt_id, odt_name, odt_per, priceup, detail } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // เพิ่มข้อมูลใน ordersType
        const insertOrderTypeQuery = `
            INSERT INTO orderstype (odt_id, odt_name, odt_per, deleted_at)
            VALUES (?, ?, ?, ?);
        `;
        const orderTypeValues = [odt_id, odt_name, odt_per, null];
        await connection.query(insertOrderTypeQuery, orderTypeValues);

        // เพิ่มข้อมูลใน ordersTypeDetail
        const detailInsertQuery = `
            INSERT INTO orderstypedetail (sm_id, odt_id, odtd_price, deleted_at)
            VALUES (?, ?, ?, null);
        `;

        for (const item of detail) {
            const odtd_price = item.sm_price + priceup;
            const detailValues = [item.sm_id, odt_id, odtd_price];
            await connection.query(detailInsertQuery, detailValues);
        }

        await connection.commit();
        res.status(201).json({ message: "Order type and details added successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Database Error:", error);
        res.status(500).json({ 
            message: "An error occurred while adding order type and details", 
            error: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
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