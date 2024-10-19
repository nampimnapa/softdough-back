const express = require("express");
const connection = require("../connection");
const router = express.Router();
const puppeteer = require('puppeteer'); // นำเข้า Puppeteer
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');


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
        SELECT sm.*, smt.*, smd.*, p.pd_name
        FROM salesmenutype smt 
        JOIN salesmenu sm ON sm.smt_id = smt.smt_id 
        JOIN salesmenudetail smd ON sm.sm_id = smd.sm_id 
        LEFT JOIN products p ON smd.pd_id = p.pd_id 
        WHERE smd.deleted_at IS NULL`;

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
    SELECT sm.*, smt.*, smd.*, p.pd_name,pc.pdc_name,
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
router.post('/generate-pdf', async (req, res, next) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });
        const page = await browser.newPage();
        const orderData = req.body;

        const htmlTemplate = fs.readFileSync(path.join(__dirname, '../public/generate.html'), 'utf8');
        const html = ejs.render(htmlTemplate, orderData);

        await page.setContent(html);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '10px', right: '10px' }
        });
        await browser.close();

        // Generate a unique filename for the PDF
        const uniqueFileName = `document-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../public', uniqueFileName);
        fs.writeFileSync(filePath, pdfBuffer);
        console.log('PDF file saved successfully at:', filePath);

        // Redirect to PDF viewer route with the unique filename
        res.redirect(`/pdf-viewer?filename=${uniqueFileName}`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({
            message: 'Error generating PDF',
            error: error.message,
            stack: error.stack
        });
    }
});

// Serve the generated PDF
router.get('/pdf-viewer', (req, res) => {
    const { filename } = req.query;
    const filePath = path.join(__dirname, '../public', filename); // Adjust path as needed

    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'PDF file not found' });
    }
});

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
        // Insert into order table
        const orderResult = await queryPromise(
            `INSERT INTO \`order\` (od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_paytype, 
            od_net, od_pay, od_change, od_status, note, sh_id, odt_id, dc_id, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            orderValues
        );

        const orderId = orderResult.insertId;

        // Insert into orderdetail table
        const orderDetailValues = [
            ...selectedItems.map(item => [orderId, item.sm_id, item.quantity, item.sm_price * item.quantity]),
            ...freeItems.map(item => [orderId, item.smfree_id, item.quantity, 0])
        ];

        const orderDetailResult = await queryPromise(
            `INSERT INTO orderdetail (od_id, sm_id, odde_qty, odde_sum) VALUES ?`,
            [orderDetailValues]
        );

        let odde_id = orderDetailResult.insertId;

        // Process items (both selected and free)
        const processItems = async (items, isFreeItems = false) => {
            for (const item of items) {
                const sm_id = isFreeItems ? item.smfree_id : item.sm_id;

                // Get salesmenu details
                const salesMenuDetails = await queryPromise(
                    `SELECT smde_id, pd_id, qty AS sm_qty FROM salesmenudetail WHERE sm_id = ?`,
                    [sm_id]
                );

                if (salesMenuDetails.length === 0) continue;

                const { smde_id, pd_id, sm_qty } = salesMenuDetails[0];
                let remainingQtyToDeduct = item.quantity * sm_qty;

                // Get available production order details, ordered by pdod_id (FIFO)
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

                    // Update production order detail stock
                    await queryPromise(
                        `UPDATE productionorderdetail SET pdod_stock = ? WHERE pdod_id = ?`,
                        [newStock, pod.pdod_id]
                    );

                    // Insert into orderdetailsalesmenu
                    await queryPromise(
                        `INSERT INTO orderdetailsalesmenu (odde_id, smde_id, pdod_id, qty) 
                        VALUES (?, ?, ?, ?)`,
                        [odde_id, smde_id, pod.pdod_id, deductQty]
                    );

                    // Insert into promotionorderdetail (only for non-free items)
                    await queryPromise(
                        `INSERT INTO promotionorderdetail (pdod_id, odde_id, qty) 
                            VALUES (?, ?, ?)`,
                        [pod.pdod_id, odde_id, deductQty]
                    );


                    remainingQtyToDeduct -= deductQty;
                }

                if (remainingQtyToDeduct > 0) {
                    throw new Error(`Insufficient stock for product ID: ${pd_id}`);
                }

                odde_id++;
            }
        };

        // Process selected items and free items
        await processItems(selectedItems);
        await processItems(freeItems, true);

        res.status(200).json({ message: "Order processed successfully", orderId });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Error processing order", error: error.message });
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

router.get('/order/:od_id', (req, res, next) => {
    const od_id = Number(req.params.od_id);

    var query = `SELECT * FROM \`order\`  WHERE od_id= ?;`;

    connection.query(query, [od_id], (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
});

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




module.exports = router;