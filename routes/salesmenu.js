const express = require("express");
const connection = require("../connection");
const router = express.Router();

const multer = require('multer');
const upload = multer();
const sharp = require('sharp');

const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')



router.get('/unit', async (req, res, next) => {
    const query = 'SELECT * FROM unit WHERE type = ?';

    try {
        const [results] = await connection.promise().query(query, ['2']);
        return res.status(200).json(results);
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while fetching units", 
            error: error.message 
        });
    }
});

router.post('/addtype', async (req, res, next) => {
    const { smt_name, un_id, qty_per_unit } = req.body;

    // Basic validation
    if (!smt_name || !un_id || qty_per_unit === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const query = "INSERT INTO salesmenutype (smt_name, un_id, qty_per_unit) VALUES (?, ?, ?)";

    try {
        const [result] = await connection.promise().query(query, [smt_name, un_id, qty_per_unit]);
        
        return res.status(201).json({ 
            message: "Category added successfully", 
            typeId: result.insertId 
        });
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while adding the sales menu type", 
            error: error.message 
        });
    }
});

router.get('/readsmt', async (req, res, next) => {
    const query = 'SELECT * FROM salesmenutype';

    try {
        const [results] = await connection.promise().query(query);
        return res.status(200).json(results);
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while fetching sales menu types", 
            error: error.message 
        });
    }
});

// router.patch('/updatesmt/:smt_id', (req, res, next) => {
//     const smt_id = req.params.smt_id;
//     const sm = req.body;
//     var query = "UPDATE salesmenutype SET smt_name=?,un_id=?,qty_per_unit=? WHERE smt_id=?";
//     connection.query(query, [sm.smt_name, sm.un_id, sm.qty_per_unit, smt_id], (err, results) => {
//         if (!err) {
//             if (results.affectedRows === 0) {
//                 console.error(err);
//                 return res.status(404).json({ message: "id does not found" });
//             }
//             return res.status(200).json({ message: "update success" });
//         } else {
//             return res.status(500).json(err);
//         }
//     });
// });

router.patch('/updatesmt/:smt_id', async (req, res, next) => {
    const smt_id = req.params.smt_id;
    const { smt_name, un_id, qty_per_unit } = req.body;

    const query = "UPDATE salesmenutype SET smt_name = ?, un_id = ?, qty_per_unit = ? WHERE smt_id = ?";

    try {
        const [result] = await connection.promise().query(query, [smt_name, un_id, qty_per_unit, smt_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Sales menu type not found" });
        }

        return res.status(200).json({ 
            message: "Sales menu type updated successfully",
            updatedId: smt_id
        });
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while updating the sales menu type", 
            error: error.message 
        });
    }
});

// router.post('/addsm', (req, res, next) => {
//     let sm = req.body;
//     query = "insert into salesmenu (smt_id,	sm_name,sm_price,status,fix,picture	) values(?,?,?,?,?,?)";
//     connection.query(query, [sm.smt_id, sm.sm_name, sm.sm_price, sm.status, sm.fix, sm.picture], (err, results) => {
//         if (!err) {
//             return res.status(200).json({ message: "success" });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// })

// router.get('/readsm', (req, res, next) => {
//     var query = 'select *from salesmenu'
//     connection.query(query, (err, results) => {
//         if (!err) {
//             return res.status(200).json(results);
//         } else {
//             return res.status(500).json(err);
//         }
//     });
// })

//read sm ข้อมูลโชว์หมดไม่ได้จัด
router.get('/sm/:sm_id', async (req, res, next) => {
    const sm_id = Number(req.params.sm_id);

    if (isNaN(sm_id)) {
        return res.status(400).json({ message: 'Invalid sales menu ID' });
    }

    const query = `
        SELECT sm.*, smt.*, smd.* 
        FROM salesmenutype smt 
        JOIN salesmenu sm ON sm.smt_id = smt.smt_id 
        JOIN salesmenudetail smd ON sm.sm_id = smd.sm_id 
        WHERE sm.sm_id = ? AND smd.deleted_at IS NULL
    `;

    try {
        const [results] = await connection.promise().query(query, [sm_id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Sales menu not found' });
        }

        // Process the results if needed
        const processedResults = results.map(result => ({
            ...result,
            picture: result.picture ? `${result.picture}` : null
            // Add any other necessary transformations here
        }));

        return res.status(200).json(processedResults);
    } catch (error) {
        console.error('Error retrieving sales menu:', error);
        return res.status(500).json({ 
            message: 'An error occurred while retrieving the sales menu', 
            error: error.message 
        });
    }
});

router.get('/smt/:id', async (req, res, next) => {
    const smt_id = Number(req.params.id);

    const query = `SELECT * FROM salesmenutype WHERE smt_id = ?`;

    try {
        const [results] = await connection.promise().query(query, [smt_id]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Sales menu type not found" });
        }
        
        return res.status(200).json(results);
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while fetching the sales menu type", 
            error: error.message 
        });
    }
});


// จัดคร่าวๆ
// router.get('/smset/:sm_id', async (req, res, next) => {
//     const sm_id = Number(req.params.sm_id);
//     try {
//         var query = `SELECT sm.*, smt.*, smd.* 
//     FROM salesMenuType smt 
//     JOIN salesMenu sm ON sm.smt_id = smt.smt_id 
//     JOIN salesMenudetail smd ON sm.sm_id = smd.sm_id 
//     WHERE sm.sm_id = ?`;

//         connection.query(query, sm_id, (err, results) => {
//             if (!err) {
//                 // ดำเนินการสร้างโครงสร้าง JSON ที่ถูกต้อง
//                 const formattedResult = {
//                     sm_id: results[0].sm_id,
//                     sm_name: results[0].sm_name,
//                     smt_id: results[0].smt_id,
//                     sm_price: results[0].sm_price,
//                     status: results[0].status,
//                     fix: results[0].fix,
//                     picture: results[0].picture,
//                     created_at: results[0].created_at,
//                     updated_at: results[0].updated_at,
//                     smt_name: results[0].smt_name,
//                     salesmenudetail: results.map(item => ({
//                         smde_id: item.smde_id,
//                         pd_id: item.pd_id,
//                         qty: item.qty,
//                         deleted_at: item.deleted_at
//                     }))
//                 };
//                 return res.status(200).json(formattedResult);
//             }
//             if (formattedResult.length === 0) {
//                 return res.status(404).json({ message: 'sm not found' });
//             }
//             const sm = formattedResult[0];

//             // If the product contains picture data
//             if (sm.picture) {
//                 // Include the base64-encoded picture data in the response
//                 sm.picture = `data:image/jpeg;base64,${sm.picture}`;
//             }
//         });
//     } catch (error) {
//         console.error('Error retrieving sm:', error);
//         return res.status(500).json({ message: 'Error retrieving sm', error });
//     }
// });
//เพิ่มเรื่อง delete ไม่โชว์
router.get('/smset/:sm_id', async (req, res, next) => {
    const sm_id = Number(req.params.sm_id);
    try {
        var query = `SELECT sm.*, smt.*, smd.* 
    FROM salesmenutype smt 
    JOIN salesmenu sm ON sm.smt_id = smt.smt_id 
    JOIN salesmenudetail smd ON sm.sm_id = smd.sm_id 
    WHERE sm.sm_id = ?`;

        connection.query(query, sm_id, (err, results) => {
            if (!err) {
                // กรองแถวของ smd ที่ deleted_at เท่ากับ null
                const filteredResults = results.filter(item => item.deleted_at === null);

                if (filteredResults.length === 0) {
                    return res.status(404).json({ message: 'sm not found' });
                }

                // ดำเนินการสร้างโครงสร้าง JSON ที่ถูกต้อง
                const formattedResult = {
                    sm_id: filteredResults[0].sm_id,
                    sm_name: filteredResults[0].sm_name,
                    smt_id: filteredResults[0].smt_id,
                    sm_price: filteredResults[0].sm_price,
                    status: filteredResults[0].status,
                    fix: filteredResults[0].fix,
                    picture: filteredResults[0].picture,
                    created_at: filteredResults[0].created_at,
                    updated_at: filteredResults[0].updated_at,
                    smt_name: filteredResults[0].smt_name,
                    salesmenudetail: filteredResults.map(item => ({
                        smde_id: item.smde_id,
                        pd_id: item.pd_id,
                        qty: item.qty,
                        deleted_at: item.deleted_at
                    }))
                };

                // If the product contains picture data
                if (formattedResult.picture) {
                    // Include the base64-encoded picture data in the response
                    formattedResult.picture = `data:image/jpeg;base64,${formattedResult.picture}`;
                }

                return res.status(200).json(formattedResult);
            } else {
                console.error('Error retrieving sm:', err);
                return res.status(500).json({ message: 'Error retrieving sm', error: err });
            }
        });
    } catch (error) {
        console.error('Error retrieving sm:', error);
        return res.status(500).json({ message: 'Error retrieving sm', error });
    }
});


//resd sm all
router.get('/small', async (req, res, next) => {
    try {
        const query = `
            SELECT sm.*, smt.smt_name 
            FROM salesmenutype smt 
            JOIN salesmenu sm ON sm.smt_id = smt.smt_id
        `;

        const [results] = await connection.promise().query(query);

        if (results.length === 0) {
            return res.status(404).json({ message: 'No sales menu items found' });
        }

        const formattedResults = results.map(result => ({
            ...result,
            picture: result.picture ? `${result.picture}` : null
        }));

        return res.status(200).json(formattedResults);
    } catch (error) {
        console.error('Error retrieving sales menu:', error);
        return res.status(500).json({ 
            message: 'An error occurred while retrieving the sales menu', 
            error: error.message 
        });
    }
});


//ดักที่เป็น type ด้วย จำนวนต่อกล่อง รวมกันต้อง=ที่กำหนดไว้พอดี
//rollback ตรง detail มีปัญหา กับ json ได้ tsx ไม่ได้ มีสำรองด้านใน บรรทัดเปลี่ยน detail
// ลูกน้ำตัดเอา Middleware ออกนะ เพราะเรายังไม่มีการ Login
router.post('/addsm', async (req, res) => {
    const { name, type, price, status, selltype, image } = req.body;
    const salesmenudetail = req.body.product;

    const conn = await connection.promise().getConnection();

    try {
        await conn.beginTransaction();

        const salesmenuWithPicture = { 
            sm_name: name, 
            smt_id: type, 
            sm_price: price, 
            status, 
            fix: selltype, 
            picture: image 
        };

        const [salesmenuResult] = await conn.query('INSERT INTO salesmenu SET ?', salesmenuWithPicture);
        const salesmenuId = salesmenuResult.insertId;

        if (!salesmenuId) {
            throw new Error('Invalid salesmenu insertion result');
        }

        if (Array.isArray(salesmenudetail) && salesmenuId) {
            let salesmenudetailQuery;
            let values;

            if (selltype === "1" || selltype === 1) {
                salesmenudetailQuery = `INSERT INTO salesmenudetail (sm_id, pd_id, qty, deleted_at) VALUES ?`;
                values = salesmenudetail.map(detail => [salesmenuId, detail.pd_id, detail.qty, null]);
            } else if (selltype === "2" || selltype === 2) {
                salesmenudetailQuery = `INSERT INTO salesmenudetail (sm_id, pd_id, qty, deleted_at) VALUES ?`;
                values = salesmenudetail.map(detail => [salesmenuId, detail.pd_id, null, null]);
            } else {
                throw new Error('Invalid fix value');
            }

            await conn.query(salesmenudetailQuery, [values]);
        } else {
            throw new Error('Invalid salesmenudetail format');
        }

        await conn.commit();

        res.status(200).json({
            salesmenuId,
            message: 'salesmenu and salesmenudetail added successfully!'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error in addsm:', error);
        res.status(500).json({ 
            message: 'An error occurred while adding salesmenu', 
            error: error.message 
        });
    } finally {
        conn.release();
    }
});

//edit กรณี insert กับิ edit มีปหใ roolback ก็งงๆ
//ได้ละจ้า ชั้นโง่เอง
router.patch('/editsm/:sm_id', async (req, res) => {
    const sm_id = req.params.sm_id;
    const { sm_name, smt_id, sm_price, status, fix, salesmenudetail, picture } = req.body;

    const conn = await connection.promise().getConnection();

    try {
        await conn.beginTransaction();

        const salesmenuWithPicture = { sm_name, smt_id, sm_price, fix, picture, status };

        const [salesMenuResult] = await conn.query(
            'UPDATE salesMenu SET ?, updated_at = CURRENT_TIMESTAMP WHERE sm_id = ?',
            [salesmenuWithPicture, sm_id]
        );

        if (salesMenuResult.affectedRows === 0) {
            throw new Error('Sales menu not found');
        }

        if (salesmenudetail && salesmenudetail.length > 0) {
            const [existingDetails] = await conn.query('SELECT pd_id FROM salesMenudetail WHERE sm_id = ?', [sm_id]);
            const existingPdIds = existingDetails.map(result => result.pd_id);
            const newPdIds = salesmenudetail.map(detail => detail.pd_id);

            const updateData = salesmenudetail.filter(item => existingPdIds.includes(item.pd_id));
            const insertData = salesmenudetail.filter(item => !existingPdIds.includes(item.pd_id));
            const deleteData = existingPdIds.filter(id => !newPdIds.includes(id));

            if (deleteData.length > 0) {
                await conn.query(
                    'UPDATE salesMenudetail SET deleted_at = CURRENT_TIMESTAMP WHERE pd_id IN (?) AND sm_id = ?',
                    [deleteData, sm_id]
                );
            }

            if (insertData.length > 0) {
                const insertQuery = 'INSERT INTO salesMenudetail (sm_id, pd_id, qty, deleted_at) VALUES ?';
                const insertValues = insertData.map(detail => [sm_id, detail.pd_id, fix === "1" ? detail.qty : null, null]);
                await conn.query(insertQuery, [insertValues]);
            }

            if (updateData.length > 0) {
                const updateQuery = 'UPDATE salesMenudetail SET qty = ?, deleted_at = NULL WHERE pd_id = ? AND sm_id = ?';
                for (const detail of updateData) {
                    await conn.query(updateQuery, [fix === "1" ? detail.qty : null, detail.pd_id, sm_id]);
                }
            }
        }

        await conn.commit();
        res.json({ message: 'Sales menu updated successfully!' });
    } catch (error) {
        await conn.rollback();
        console.error('Error updating sales menu:', error);
        res.status(500).json({ 
            message: 'An error occurred while updating the sales menu', 
            error: error.message 
        });
    } finally {
        conn.release();
    }
});


//ลอ งกะบ tsx json ไม่ได้

// router.post('/addsm', upload.single('picture'), async (req, res) => {
//     const { sm_name, smt_id, sm_price, fix, salesmenudetail } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     try {
//       let imageBase64 = null;

//       // ตรวจสอบว่ามีรูปภาพที่อัปโหลดเข้ามาหรือไม่
//       if (imageBuffer) {
//         // ปรับขนาดรูปภาพ
//         const resizedImageBuffer = await sharp(imageBuffer)
//           .resize({ width: 300, height: 300 })
//           .toBuffer();

//         // เปลี่ยนข้อมูลรูปภาพเป็น base64
//         imageBase64 = resizedImageBuffer.toString('base64');
//       }

//       const salesmenuWithPicture = { sm_name, smt_id, sm_price, fix, picture: imageBase64 };

//       connection.beginTransaction((err) => {
//         if (err) {
//           return res.status(500).json({ message: 'Transaction start error', error: err });
//         }

//         connection.query('INSERT INTO salesMenu SET ?', salesmenuWithPicture, (err, salesmenuResult) => {
//           if (err) {
//             console.error('Error inserting salesmenu:', err);
//             connection.rollback(() => {
//               res.status(500).json({ message: 'Error inserting salesmenu', error: err });
//             });
//             return res.status(500).json({ message: 'An error occurred' });
//           }

//           if (!salesmenuResult || !salesmenuResult.insertId) {
//             console.error('salesMenu insertion result is invalid:', salesmenuResult);
//             connection.rollback(() => {
//               res.status(500).json({ message: 'Invalid salesmenu insertion result' });
//             });
//             return res.status(500).json({ message: 'An error occurred' });
//           }


//           const salesmenuId = salesmenuResult.insertId;
//           console.log(salesmenudetail)
//           const parsedSalesmenudetail = JSON.parse(salesmenudetail);
//           console.log(parsedSalesmenudetail)

//           if (parsedSalesmenudetail && Array.isArray(parsedSalesmenudetail)) {
//             if (fix === "1" || fix === "2") {
//               const salesmenudetail1 = parsedSalesmenudetail.map(detail => [salesmenuId, detail.pd_id, detail.qty, null]);
//               const salesmenudetailQuery = `INSERT INTO salesMenudetail (sm_id, pd_id, qty, deleted_at) VALUES ?`;
//               connection.query(salesmenudetailQuery, [salesmenudetail1], (err, detailResults) => {
//                 if (err) {
//                   connection.rollback(() => { 
//                     return res.status(500).json({ message: 'Error inserting salesmenu details', error: err });
//                   });
//                 }
//                 if (!detailResults || !detailResults.insertId) {
//                   console.error('salesMenu insertion result is invalid:', salesmenuResult);
//                   connection.rollback(() => {
//                     res.status(500).json({ message: `Invalid salesmenu insertion result ${fix}` });
//                   });
//                   return res.status(500).json({ message: 'An error occurred detail' });
//                 }

//                 connection.commit((err) => {
//                   if (err) {
//                     connection.rollback(() => {
//                       return res.status(500).json({ message: 'Transaction commit error', error: err });
//                     });
//                   }

//                   return res.json({
//                     salesmenuId,
//                     message: 'salesmenu and salesmenudetail added successfully!',
//                   });
//                 });
//               });
//             } else {
//               return res.status(400).json({ message: 'Invalid fix value' });
//             }
//           } else {
//             return res.status(400).json({ message: 'Invalid salesmenudetail format' });
//           }
//         });
//       });
//     } catch (error) {
//       console.error('Error resizing image:', error);
//       return res.status(500).json({ message: 'Error resizing image', error });
//     }
//   });




//ตาม type ในหนเา promo
router.get('/readsmfromt', (req, res, next) => {
    let smt_ids = req.query.smt_id;

    // Ensure smt_ids is an array
    if (!Array.isArray(smt_ids)) {
        smt_ids = [smt_ids];
    }

    // Ensure smt_ids is not empty
    if (smt_ids.length > 0) {
        const query = `
            SELECT *
            FROM salesMenuType smt 
            JOIN salesMenu sm ON sm.smt_id = smt.smt_id 
            WHERE sm.smt_id IN (?)
        `;

        connection.query(query, [smt_ids], (err, results) => {
            if (!err) {
                return res.status(200).json(results);
            } else {
                return res.status(500).json(err);
            }
        });
    } else {
        return res.status(400).json({ message: 'Invalid or missing smt_id array' });
    }
});

module.exports = router;