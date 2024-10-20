const express = require("express");
const connection = require("../connection");
const router = express.Router();

async function getIngredientUsedDetails(req, res) {
    try {
        const { startDate, endDate } = req.query;

        const sql = `
        SELECT 
            pod.pdod_id,
            DATE_FORMAT(pod.created_at, '%Y-%m-%d') AS pdocreated_at,
            pod.qty,
            CONCAT('PD', LPAD( pod.pdo_id, 7, '0')) AS pdo_id_name,
            u.un_name,
            pod.pdo_id,
            iup.induP_id,
            iup.indlde_id,
            iup.qtyusesum,
            ild.price,
            iup.status,
            iup.scrap,
            p.pd_id,
            p.pd_name,
            ild.qtypurchased,
            i.qty_per_unit,
            iup.created_at,
            pc.pdc_name,
            (iup.qtyusesum * ild.price) / (ild.qtypurchased * i.qty_per_unit) AS costingredient
        FROM ingredient_used_pro iup
        JOIN productionorderdetail pod ON iup.pdod_id = pod.pdod_id  
        JOIN products p ON pod.pd_id = p.pd_id     
        LEFT JOIN productcategory pc ON pc.pdc_id = p.pdc_id                                         
        LEFT JOIN recipe r ON r.pd_id = p.pd_id       
        LEFT JOIN unit u ON u.un_id = r.un_id                                     
        LEFT JOIN recipedetail rd ON rd.rc_id = r.rc_id   
        LEFT JOIN ingredient_lot_detail ild ON iup.indlde_id = ild.indlde_id 
        LEFT JOIN ingredient i ON ild.ind_id = i.ind_id               
        WHERE DATE(iup.created_at) BETWEEN ? AND ?
        `;

        connection.query(sql, [startDate, endDate], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Database query failed' });
            } else {
                // จัดกลุ่มผลลัพธ์ตาม pd_id และ pd_name พร้อมตรวจสอบค่าซ้ำ
                const groupedResults = results.reduce((acc, row) => {
                    const { pd_id, pd_name, pdc_name, pdo_id, un_name, pdo_id_name, pdod_id, pdocreated_at, induP_id, qty } = row;

                    // ค้นหาว่ามี pd_id นี้อยู่ใน acc หรือไม่
                    let product = acc.find(item => item.pd_id === pd_id);

                    if (!product) {
                        // ถ้ายังไม่มีใน acc ให้เพิ่มผลิตภัณฑ์ใหม่
                        product = {
                            pd_id: pd_id,
                            pd_name: pd_name,
                            pdc_name: pdc_name,
                            totalCost: 0, // เพิ่มฟิลด์ totalCost เพื่อใช้ในแดชบอร์ด
                            used: []
                        };
                        acc.push(product);
                    }

                    // ค้นหาว่า pdo_id และ pdod_id นี้มีอยู่ใน used หรือไม่
                    let usedEntry = product.used.find(item => item.pdo === pdo_id && item.pdod_id === pdod_id);

                    if (!usedEntry) {
                        // ถ้ายังไม่มีให้สร้าง entry ใหม่พร้อม sumcost
                        usedEntry = {
                            pdo: pdo_id,
                            pdo_id_name: pdo_id_name,
                            pdocreated_at: pdocreated_at,
                            pdod_id: pdod_id,
                            un_name: un_name,
                            qtyUsed: qty,
                            sumCost: 0,
                            perPiece: 0,
                            detail: []
                        };
                        product.used.push(usedEntry);
                    }

                    // ตรวจสอบว่า detail มีข้อมูลนี้อยู่หรือไม่
                    const detailExists = usedEntry.detail.some(detailItem =>
                        detailItem.induP_id === row.induP_id && detailItem.indlde_id === row.indlde_id
                    );

                    if (!detailExists) {
                        // เพิ่มรายละเอียดของการใช้ส่วนประกอบลงใน detail
                        usedEntry.detail.push({
                            induP_id: row.induP_id,
                            indlde_id: row.indlde_id,
                            qtyUseSum: row.qtyusesum,
                            price: row.price,
                            status: row.status,
                            scrap: row.scrap,
                            qtyPurchased: row.qtypurchased,
                            qtyPerUnit: row.qty_per_unit,
                            createdAt: row.created_at,
                            costIngredient: row.costingredient
                        });

                        // เพิ่ม costingredient ลงใน sumCost ของ usedEntry
                        // อัปเดต sumCost และ perPiece ให้เป็นตัวเลขที่มีทศนิยม 2 ตำแหน่ง
                        usedEntry.sumCost = parseFloat((usedEntry.sumCost + row.costingredient).toFixed(2));
                        usedEntry.perPiece = parseFloat((usedEntry.sumCost / usedEntry.qtyUsed).toFixed(2));

                        // อัปเดต totalCost ของ product ด้วยค่า sumCost ของ usedEntry และทศนิยม 2 ตำแหน่ง
                        product.totalCost = parseFloat((product.totalCost + row.costingredient).toFixed(2));

                    }

                    return acc;
                }, []);

                // ส่งข้อมูลที่จัดกลุ่มและกรองแล้วกลับไปยัง client
                res.status(200).json(groupedResults);
            }
        });
    } catch (error) {
        console.error('Error fetching ingredient used details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// Route สำหรับดึงข้อมูลการใช้วัตถุดิบ
router.get('/getIngredientUsedDetails', getIngredientUsedDetails);



//order
async function getOrderDetails(req, res) {
    try {
        const { startDate, endDate } = req.query;

        const sql = `
        SELECT 
            DATE_FORMAT(o.created_at, '%Y-%m-%d') AS ocreated_at,
            od.odde_sum,
            od.odde_qty,
            od.odde_id,
            od.od_id,
            s.sm_id,
            s.sm_name,
            st.smt_name,
            ot.odt_name
        FROM orderdetail od
        JOIN \`order\` o ON o.od_id = od.od_id  
        JOIN salesmenu s ON s.sm_id = od.sm_id  
        LEFT JOIN salesmenutype st ON s.smt_id = st.smt_id      
        LEFT JOIN orderstype ot ON ot.odt_id = o.odt_id          
    
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        `;
    
        connection.query(sql, [startDate, endDate], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).json({ message: 'Database query failed' });
            } else {
                // Grouping results based on sm_id and other properties
                const groupedResults = results.reduce((acc, row) => {
                    const { sm_id, sm_name, smt_name, odde_sum, odde_id, odde_qty, od_id, ocreated_at,odt_name } = row;

                    // Find if sm_id already exists in acc
                    let sm = acc.find(item => item.sm_id === sm_id);

                    if (!sm) {
                        // If sm_id not found, create a new entry for the salesmenu
                        sm = {
                            sm_id: sm_id,
                            sm_name: sm_name,
                            smt_name: smt_name,
                            totalprice: 0,  // Initialize total price
                            totalqty: 0,    // Initialize total quantity
                            orderdetail: []
                        };
                        acc.push(sm);
                    }

                    // Find if this orderdetail already exists in the orderdetail array
                    let orderdetailEntry = sm.orderdetail.find(item => item.odde_id === odde_id);

                    if (!orderdetailEntry) {
                        // If not found, add a new orderdetail entry
                        orderdetailEntry = {
                            odt_name:odt_name,
                            odde_id: odde_id,
                            odde_sum: odde_sum,
                            odde_qty: odde_qty,
                            od_id: od_id,
                            ocreated_at: ocreated_at
                        };
                        sm.orderdetail.push(orderdetailEntry);
                    }

                    // Update the total price and quantity
                    sm.totalprice += parseFloat(odde_sum);
                    sm.totalqty += parseInt(odde_qty, 10);

                    return acc;
                }, []);

                // Send the grouped results back to the client
                res.status(200).json(groupedResults);
            }
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

router.get('/getOrderDetails', getOrderDetails);
//expen
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
