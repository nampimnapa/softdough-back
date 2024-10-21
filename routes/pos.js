const express = require("express");
const connection = require("../connection");
const router = express.Router();
const puppeteer = require('puppeteer'); // นำเข้า Puppeteer
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const moment = require('moment');

// เปลี่ยนราคา
router.get('/small/:delitype?', async (req, res, next) => {
    const delitype = Number(req.params.delitype);
    if (!delitype)
        return res.status(200).json({});
    try {
        var query = `SELECT sm.sm_id,sm.sm_name,sm.smt_id,sm.status,sm.fix,sm.picture,typede.odtd_price AS sm_price
            FROM salesmenu sm 
            JOIN orderstypedetail typede ON typede.sm_id = sm.sm_id
            WHERE typede.odt_id=${delitype};`;

        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error retrieving sm:', err);
                return res.status(500).json({ message: 'Error retrieving sm', error: err });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'sm not found' });
            }

            // Loop through the results to modify each result as needed
            results.forEach(result => {
                // If the product contains picture data
                if (result.picture) {
                    // Include the base64-encoded picture data in the response
                    result.picture = `${result.picture}`;
                }
            });

            return res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error retrieving sm:', error);
        return res.status(500).json({ message: 'Error retrieving sm', error });
    }
});

router.get('/sm', async (req, res, next) => {
    try {
        query = `
        SELECT sm.sm_id,sm.sm_name,sm.sm_price,sm.status,sm.fix,sm.picture, smt.smt_id,smt.smt_name, smt.qty_per_unit
        FROM salesmenutype smt 
        JOIN salesmenu sm ON sm.smt_id = smt.smt_id`;

        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error retrieving sm:', err);
                return res.status(500).json({ message: 'Error retrieving sm', error: err });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'sm not found' });
            }

            // Loop through the results to modify each result as needed
            results.forEach(result => {
                // If the product contains picture data
                if (result.picture) {
                    // Include the base64-encoded picture data in the response
                    result.picture = `${result.picture}`;
                }
            });

            return res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error retrieving sm:', error);
        return res.status(500).json({ message: 'Error retrieving sm', error });
    }
});

// คละทั้งหมด กรณีจะแยกตรงหนเา pos
router.get('/smmix', (req, res, next) => {
    const sm_id = Number(req.params.sm_id);

    var query = `
    SELECT sm.*, smt.*, smd.*, p.pd_name
FROM salesmenutype smt 
JOIN salesmenu sm ON sm.smt_id = smt.smt_id 
JOIN salesmenudetail smd ON sm.sm_id = smd.sm_id 
LEFT JOIN products p ON smd.pd_id = p.pd_id  
WHERE sm.fix = '2'  
  AND smd.deleted_at IS NULL;
`;

    connection.query(query, [sm_id], (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});


router.get('/sm/:sm_id', (req, res, next) => {
    const sm_id = Number(req.params.sm_id);

    var query = `
    SELECT smd.smde_id, p.pd_name,pc.pdc_name, p.picture, p.pd_id,
           CASE 
               WHEN sm.fix = '2' THEN p.pd_name 
               ELSE NULL 
           END AS pd_name 
    FROM salesmenutype smt 
    JOIN salesmenu sm ON sm.smt_id = smt.smt_id 
    JOIN salesmenudetail smd ON sm.sm_id = smd.sm_id 
    LEFT JOIN products p ON smd.pd_id = p.pd_id  
    JOIN productcategory pc ON p.pdc_id = pc.pdc_id
    WHERE sm.sm_id = ? 
      AND smd.deleted_at IS NULL`;

    connection.query(query, [sm_id], (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});





// puppeteer ยังบ่แล้ว เทส
// Generate the PDF and save it with a dynamic name
router.post('/generate-pdf', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        const orderData = req.body; // รับข้อมูล order ที่เพิ่งสร้าง

        // ใช้ template HTML เพื่อแสดงข้อมูล
        const htmlTemplate = fs.readFileSync(path.join(__dirname, '../public/generate.html'), 'utf8');
        const html = ejs.render(htmlTemplate, orderData); // สร้าง HTML จากข้อมูล orderData

        await page.setContent(html);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '10px', right: '10px' }
        });
        await browser.close();

        // สร้างชื่อไฟล์ unique สำหรับไฟล์ PDF
        const uniqueFileName = `order-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../', uniqueFileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // ส่ง URL ไปยัง pdf-viewer route เพื่อแสดงไฟล์
        res.json({ filename: uniqueFileName }); // ส่งชื่อไฟล์กลับไปให้ frontend
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Error generating PDF' });
    }
});




// Serve the generated PDF
router.get('/pdf-viewer', (req, res) => {
    const filePath = path.join(__dirname, '../document1.pdf'); // File outside 'public'
    console.log('Resolved file path:', filePath);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document1.pdf"');
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'PDF file not found' });
    }
});
// Serve the generated PDF
// router.get('/pdf-viewer', (req, res) => {
//     const filename = req.query.filename;
//     const filePath = path.join(__dirname, '../', filename); // ดึงไฟล์ที่อยู่ในโฟลเดอร์ pdfs

//     // Check if the file exists
//     if (fs.existsSync(filePath)) {
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
//         res.sendFile(filePath);
//     } else {
//         res.status(404).json({ error: 'PDF file not found' });
//     }
// });



// Save order
// router.post('/order', async (req, res, next) => {
//     const userId = req.session.st_id; // ดึง user_id จาก session
//     console.log(req.session)
//     const { od_date,
//         od_qtytotal,
//         od_sumdetail,
//         od_discounttotal,
//         od_paytype,
//         od_net,
//         od_pay,
//         od_change,
//         od_status,
//         note,
//         sh_id,
//         odt_id,
//         dc_id,
//         user_id,
//         selectedItems } = req.body;
//     const values = [
//         od_date,
//         od_qtytotal,
//         od_sumdetail,
//         od_discounttotal,
//         od_paytype,
//         od_net,
//         od_pay,
//         od_change,
//         od_status,
//         note,
//         sh_id,
//         odt_id,
//         dc_id ? dc_id : null, // Set to null if not provided
//         userId // Assuming you also want to store user ID
//     ];
//     const query = `INSERT INTO \`order\`(od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_paytype, od_net, od_pay, od_change, od_status, note, sh_id, odt_id, dc_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
//     connection.query(query, values, (err, results) => {
//         if (!err) {
//             const detailQuery = `
//             INSERT INTO orderdetail (
//                 od_id, sm_id, odde_qty, odde_sum) VALUES ?;
//         `;
//             const detailValues = selectedItems.map(detail => [
//                 results.insertId,
//                 detail.sm_id,
//                 detail.quantity,
//                 detail.quantity * detail.sm_price,
//             ]);    
//             connection.query(detailQuery, [detailValues], (err, resultsAll) => {
//                 if (!err) {
//                     return res.status(200).json({ message: "success" });
//                 } else {
//                     console.error("MySQL Error detail:", err);
//                     return res.status(500).json({ message: "error detail", error: err });
//                 }
//             });

//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });

// })


// เทสหักสต้อก คือต้องทำใหม่
router.post('/order', async (req, res) => {
    const userId = req.session.st_id;
    const {
        od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_paytype,
        od_net, od_pay, od_change, od_status, note, sh_id, odt_id, dc_id,
        selectedItems, freeItems
    } = req.body;

    const orderValues = [
        od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_paytype,
        od_net, od_pay, od_change, od_status, note, sh_id, odt_id, dc_id, userId
    ];

    try {
        // บันทึกข้อมูลลงในตาราง order
        const orderResult = await queryPromise(
            `INSERT INTO \`order\` (od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_paytype, 
            od_net, od_pay, od_change, od_status, note, sh_id, odt_id, dc_id, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            orderValues
        );

        const orderId = orderResult.insertId;

        // บันทึกข้อมูลลงในตาราง orderdetail
        const orderDetailValues = [
            ...selectedItems.map(item => [orderId, item.sm_id, item.quantity, item.sm_price * item.quantity]),
            ...freeItems.map(item => [orderId, item.smfree_id, item.quantity, 0])
        ];

        const orderDetailResult = await queryPromise(
            `INSERT INTO orderdetail (od_id, sm_id, odde_qty, odde_sum) VALUES ?`,
            [orderDetailValues]
        );

        let odde_id = orderDetailResult.insertId;

        // ฟังก์ชันสำหรับประมวลผลรายการสินค้า
        const processItems = async (items, isFreeItems = false) => {
            for (const item of items) {
                const sm_id = isFreeItems ? item.smfree_id : item.sm_id;

                // ดึงข้อมูลรายละเอียดเมนูขาย
                const salesMenuDetails = await queryPromise(
                    `SELECT smde_id, pd_id, qty AS sm_qty FROM salesmenudetail WHERE sm_id = ?`,
                    [sm_id]
                );

                if (salesMenuDetails.length === 0) continue;

                const { smde_id, pd_id, sm_qty } = salesMenuDetails[0];
                let remainingQtyToDeduct = item.quantity * sm_qty;

                // ดึงข้อมูลรายการผลิตที่มีสินค้าพร้อมขาย เรียงตาม FIFO
                const productionOrderDetails = await queryPromise(
                    `SELECT pdod_id, pdod_stock FROM productionorderdetail 
                    WHERE pd_id = ? AND status IN (3, 4) AND pdod_stock > 0
                    ORDER BY pdod_id ASC`,
                    [pd_id]
                );

                for (const pod of productionOrderDetails) {
                    if (remainingQtyToDeduct <= 0) break;

                    const deductQty = Math.min(remainingQtyToDeduct, pod.pdod_stock);
                    const newStock = pod.pdod_stock - deductQty;

                    // อัปเดตสต็อกในรายการผลิต
                    await queryPromise(
                        `UPDATE productionorderdetail SET pdod_stock = ? WHERE pdod_id = ?`,
                        [newStock, pod.pdod_id]
                    );

                    if (isFreeItems) {
                        // บันทึกข้อมูลของแถมลงในตาราง promotionorderdetail
                        await queryPromise(
                            `INSERT INTO promotionorderdetail (pdod_id, odde_id, qty) 
                            VALUES (?, ?, ?)`,
                            [pod.pdod_id, odde_id, deductQty]
                        );
                    } else {
                        // บันทึกข้อมูลสินค้าปกติลงในตาราง orderdetailsalesmenu
                        await queryPromise(
                            `INSERT INTO orderdetailsalesmenu (odde_id, smde_id, pdod_id, qty) 
                            VALUES (?, ?, ?, ?)`,
                            [odde_id, smde_id, pod.pdod_id, deductQty]
                        );
                    }

                    remainingQtyToDeduct -= deductQty;
                }

                if (remainingQtyToDeduct > 0) {
                    throw new Error(`สินค้าไม่เพียงพอสำหรับรหัสสินค้า: ${pd_id}`);
                }

                odde_id++;
            }
        };

        // ประมวลผลสินค้าปกติ
        await processItems(selectedItems, false);
        // ประมวลผลสินค้าแถม
        await processItems(freeItems, true);
        // นับสต็อคล่าสุดหลังจากประมวลผลคำสั่งซื้อ
        const updatedStock = await countCurrentStock();

        res.status(200).json({
            message: "ประมวลผลคำสั่งซื้อเสร็จสมบูรณ์",
            orderId,
            currentStock: updatedStock
        });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการประมวลผลคำสั่งซื้อ:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลคำสั่งซื้อ", error: error.message });
    }
});


// ฟังก์ชันเพื่อแปลงการ query แบบ callback เป็น promise
const queryPromise = (query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// ฟังก์ชันสำหรับนับจำนวนสต็อคปัจจุบัน
async function countCurrentStock() {
    try {
        const stockResult = await queryPromise(`
            SELECT pd_id, SUM(pdod_stock) as total_stock
            FROM productionorderdetail
            WHERE status IN (3, 4)
            GROUP BY pd_id
        `);
        return stockResult.reduce((acc, item) => {
            acc[item.pd_id] = item.total_stock;
            return acc;
        }, {});
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการนับสต็อค:", error);
        throw error;
    }
}

async function countCurrentStockWithNamesAndExpiry() {
    try {
        const stockResult = await queryPromise(`
            SELECT 
                p.pd_id,
                p.pd_name,
                p.picture,  -- Added picture field
                pod.pdod_id,
                pod.pdod_stock,
                DATE(pod.created_at) AS created_date,
                r.qtylifetime,
                DATE(DATE_ADD(pod.created_at, INTERVAL r.qtylifetime DAY)) AS exp_date
            FROM productionorderdetail pod
            JOIN products p ON pod.pd_id = p.pd_id
            JOIN recipe r ON p.pd_id = r.pd_id
            WHERE pod.status IN (3, 4) 
            AND pod.pdod_stock > 0 
            AND DATE(DATE_ADD(pod.created_at, INTERVAL r.qtylifetime DAY)) >= CURDATE()
            ORDER BY p.pd_id, pod.created_at
        `);

        const result = stockResult.reduce((acc, item) => {
            if (!acc[item.pd_id]) {
                acc[item.pd_id] = {
                    pd_id: item.pd_id,
                    pd_name: item.pd_name,
                    picture: item.picture,  // Added picture to the result
                    total_stock: 0,
                    detailstock: []
                };
            }
            acc[item.pd_id].total_stock += item.pdod_stock;
            acc[item.pd_id].detailstock.push({
                pdod_id: item.pdod_id,
                pdod_stock: item.pdod_stock,
                created_date: item.created_date,
                exp_date: item.exp_date
            });
            return acc;
        }, {});

        return Object.values(result);
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการนับสต็อค ดึงชื่อสินค้า รูปภาพ และคำนวณวันหมดอายุ:", error);
        throw error;
    }
}

// API ข้อมูลสต็อคปัจจุบัน ชื่อสินค้า และวันหมดอายุ
router.get('/countstock', async (req, res) => {
    try {
        const currentStockWithNamesAndExpiry = await countCurrentStockWithNamesAndExpiry();
        res.status(200).json(currentStockWithNamesAndExpiry);
    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสต็อค ชื่อสินค้า และวันหมดอายุ", error: error.message });
    }
});

router.get('/todaychange', async (req, res, next) => {
    const query = `
        SELECT 
            circulating_money.change,
            DATE_FORMAT(circulating_money.created_at, '%Y-%m-%d') AS date
        FROM circulating_money
        WHERE DATE(circulating_money.created_at) = CURDATE()
        ORDER BY circulating_money.created_at DESC
        LIMIT 1
    `;

    try {
        const db = connection.promise();
        const [results] = await db.query(query);

        if (results.length > 0) {
            const { change, date, time } = results[0];
            return res.status(200).json({
                change,
                date

            });
        } else {
            return res.status(404).json({ message: "No circulating money data found for today" });
        }
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
            message: "An error occurred while fetching today's circulating money data",
            error: err.message
        });
    }
});



// ปิดรอบการขาย
router.put('/close', async (req, res) => {
    const { deposit, scrap, note } = req.body;
    const userId = req.session.st_id; // ตรวจสอบให้แน่ใจว่า session ถูกตั้งค่าถูกต้อง

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: No user session found" });
    }

    const query = `
        UPDATE circulating_money 
        SET deposit = ?, scrap = ?, note = ?, status = '0', user_id = ?
        WHERE status = '1'
        ORDER BY created_at DESC
        LIMIT 1
    `;

    try {
        const [result] = await connection.promise().query(query, [deposit, scrap, note, userId]);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "success" });
        } else {
            res.status(404).json({ message: "No open sales round found" });
        }
    } catch (error) {
        console.error("Error closing sales round:", error);
        res.status(500).json({ message: "error", error: error.message });
    }
});

// ดึงข้อมูลรอบการขาย
router.get('/current', async (req, res) => {
    const query = `
        SELECT cm.*, s.st_name
        FROM circulating_money cm
        LEFT JOIN staff s ON cm.user_id = s.st_id
        ORDER BY cm.created_at DESC
        LIMIT 1
    `;

    try {
        const [rows] = await connection.promise().query(query);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: "No open sales round found" });
        }
    } catch (error) {
        console.error("Error fetching current sales round:", error);
        res.status(500).json({ message: "error", error: error.message });
    }
});

// all
router.get('/order', (req, res, next) => {
    const od_id = Number(req.params.od_id);

    var query = `
        SELECT o.*, s.st_name, ot.odt_name FROM \`order\` o 
        LEFT JOIN staff s ON o.user_id = s.st_id 
        LEFT JOIN orderstype ot ON o.odt_id = ot.odt_id`;

    connection.query(query, [od_id], (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
});

// router.get('/order/:od_id', (req, res, next) => {
//     const od_id = Number(req.params.od_id);

//     var query = `SELECT * FROM \`order\`  WHERE od_id= ?;`;

//     connection.query(query, [od_id], (err, results) => {
//         if (!err) {
//             return res.status(200).json(results);
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });

router.get('/latest', (req, res, next) => {
    const query = `SELECT * FROM \`order\` ORDER BY od_id DESC LIMIT 1;`; // ดึงคำสั่งซื้อที่ล่าสุด
    // console.log("SELECT * FROM \`order\` ORDER BY od_id DESC LIMIT 1;")
    // return res.status(200).json({mes:"Test"}); // ส่งกลับเฉพาะคำสั่งซื้อล่าสุด
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results[0]); // ส่งกลับเฉพาะคำสั่งซื้อล่าสุด
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
});

router.get('/order/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    try {
        // ดึงข้อมูลหลักของออเดอร์
        const orderQuery = `
            SELECT o.*, s.st_name as staff_name, ot.odt_name
            FROM \`order\` o
            LEFT JOIN staff s ON o.user_id = s.st_id
            LEFT JOIN orderstype ot ON o.odt_id = ot.odt_id
            WHERE o.od_id = ?
        `;
        const [orderDetails] = await queryPromise(orderQuery, [orderId]);
        console.log("Order Details:", orderDetails);

        if (!orderDetails) {
            return res.status(404).json({ message: "ไม่พบข้อมูลออเดอร์" });
        }

        // ดึงข้อมูลรายการสินค้าในออเดอร์
        const itemsQuery = `
            SELECT od.odde_id, od.sm_id, od.odde_qty, od.odde_sum,
                   sm.sm_name, sm.sm_price, od.od_id
            FROM orderdetail od
            JOIN salesmenu sm ON od.sm_id = sm.sm_id
            WHERE od.od_id = ?
        `;
        const items = await queryPromise(itemsQuery, [orderId]);
        console.log("Items:", items);

        // สร้าง response object
        const response = {
            od_id: orderDetails.od_id,
            od_date: orderDetails.od_date,
            od_qtytotal: orderDetails.od_qtytotal,
            od_sumdetail: orderDetails.od_sumdetail,
            od_discounttotal: orderDetails.od_discounttotal,
            od_net: orderDetails.od_net,
            od_paytype: orderDetails.od_paytype,
            od_pay: orderDetails.od_pay,
            od_change: orderDetails.od_change,
            od_status: orderDetails.od_status,
            note: orderDetails.note,
            sh_id: orderDetails.sh_id,
            odt_id: orderDetails.odt_id,
            dc_id: orderDetails.dc_id,
            user_id: orderDetails.user_id,
            created_at: orderDetails.created_at,
            updated_at: orderDetails.updated_at,
            staff_name: orderDetails.staff_name,
            odt_name: orderDetails.odt_name,
            items: items
        };

        console.log("Final Response:", JSON.stringify(response, null, 2));

        res.status(200).json(response);
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์", error: error.message });
    }
});


module.exports = router;