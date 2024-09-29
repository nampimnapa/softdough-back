const express = require("express");
const connection = require("../connection");
const router = express.Router();
const puppeteer = require('puppeteer'); // นำเข้า Puppeteer

// เปลี่ยนราคา
router.get('/small/:delitype?', async (req, res, next) => {
    const delitype = Number(req.params.delitype);
    if (!delitype)
        return res.status(200).json({});
    try {
        var query = `SELECT sm.sm_id,sm.sm_name,sm.smt_id,sm.status,sm.fix,sm.picture,typede.odtd_price AS sm_price
            FROM salesMenu sm 
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
        FROM salesMenuType smt 
        JOIN salesMenu sm ON sm.smt_id = smt.smt_id 
        JOIN salesMenudetail smd ON sm.sm_id = smd.sm_id 
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
FROM salesMenuType smt 
JOIN salesMenu sm ON sm.smt_id = smt.smt_id 
JOIN salesMenudetail smd ON sm.sm_id = smd.sm_id 
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
    SELECT sm.*, smt.*, smd.*, p.pd_name,
           CASE 
               WHEN sm.fix = '2' THEN p.pd_name 
               ELSE NULL 
           END AS pd_name 
    FROM salesMenuType smt 
    JOIN salesMenu sm ON sm.smt_id = smt.smt_id 
    JOIN salesMenudetail smd ON sm.sm_id = smd.sm_id 
    LEFT JOIN products p ON smd.pd_id = p.pd_id  
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
router.get('/generate-pdf', async (req, res, next) => {
    try {
        const browser = await puppeteer.launch({
            headless: true, // ให้ Puppeteer ทำงานในโหมด headless
        });

        const page = await browser.newPage();

        // ไปที่ URL ของหน้าเว็บที่คุณต้องการแปลงเป็น PDF
        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle0', // รอให้โหลดทุกอย่างเสร็จสิ้น
        });

        // สร้างไฟล์ PDF ขนาด A4 และพิมพ์พื้นหลัง
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
        });

        await browser.close();

        // ตั้งค่า header ของ response เพื่อส่งไฟล์ PDF กลับไปให้ client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
        res.send(pdf);
    } catch (error) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({ message: 'Error generating PDF', error });
    }
});

// Save order
router.post('/order', async (req, res, next) => {
    const userId = req.session.st_id; // ดึง user_id จาก session
    console.log(req.session)
    const { od_date,
        od_qtytotal,
        od_sumdetail,
        od_discounttotal,
        od_paytype,
        od_net,
        od_pay,
        od_change,
        od_status,
        note,
        sh_id,
        odt_id,
        dc_id,
        user_id } = req.body;
    const values = [
        od_date,
        od_qtytotal,
        od_sumdetail,
        od_discounttotal,
        od_paytype,
        od_net,
        od_pay,
        od_change,
        od_status,
        note,
        sh_id,
        odt_id,
        dc_id,
        // user_id,
        userId // Assuming you also want to store user ID
    ];
    // const query = `INSERT INTO order(od_date,od_qtytotal,od_sumdetail,od_discounttotal,od_paytype,od_net,od_pay,od_change,od_status,note,sh_id,odt_id,dc_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?);`;
    const query = `INSERT INTO \`order\`(od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_paytype, od_net, od_pay, od_change, od_status, note, sh_id, odt_id, dc_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    connection.query(query, values, (err, results) => {
        if (!err) {
            return res.status(200).json({ message: "success" });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });

    // const { sh_id, odt_id, dc_id, user_id, od_date, od_qtytotal, od_sumdetail, od_discounttotal, od_net, od_paytype, od_pay, od_change, od_status, note } = req.body;
})

module.exports = router;