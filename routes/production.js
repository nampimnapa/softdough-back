const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')


//ส่วน select ประเภทเมนู แล้วต้องไปแสดง pd ที่เป็นประเภทเมนูนี้ในอีก select
router.get('/selectpdt/:pdc_id', (req, res, next) => {
    const pdc_id = Number(req.params.pdc_id);

    var query = `SELECT pd.pd_name, pdc.*
    FROM productCategory pdc 
    JOIN products pd ON pdc.pdc_id = pd.pdc_id 
    WHERE pdc.pdc_id = ?`
    connection.query(query, pdc_id, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

//ยังไม่เพิ่มส่วน คำนวณต้นทุน
router.post('/addProductionOrder', (req, res, next) => {
    // const ingredient_lot = req.body;
    // const ingredient_lot_detail = req.body;
    const productionOrder = req.body.productionOrder[0]; // Access the first item in the productionOrder array
    const productionOrderdetail = req.body.productionOrderdetail;


    const query = "INSERT INTO productionOrder (cost_pricesum,pdo_status) VALUES (null,?)";

    connection.query(query, [productionOrder.pdo_status], (err, results) => {

        if (!err) {
            const pdo_id = results.insertId;
            console.log(productionOrder.pdo_status,"productionOrder.pdo_status")
            const values = productionOrderdetail.map(detail => [
                detail.qty,
                productionOrder.pdo_status,
                pdo_id,
                detail.pd_id,
                null // กำหนดให้ deleted_at เป็น null
            ]);

            const detailQuery = `
                INSERT INTO productionOrderdetail (qty, status, pdo_id, pd_id, deleted_at) VALUES ?
            `;

            connection.query(detailQuery, [values], (err, results) => {
                if (err) {
                    console.error("MySQL Error:", err);
                    return res.status(500).json({ message: "error", error: err });
                } else {
                    return res.status(200).json({ message: "success", pdo_id });
                }
            });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });

});
router.get('/readall',  (req, res, next) => {
    // const indl_id = req.params.id;
    var query = `
    SELECT
        productionOrder.*,
        CONCAT('PD', LPAD(pdo_id, 7, '0')) AS pdo_id_name,
        DATE_FORMAT(updated_at, '%Y-%m-%d') AS 	updated_at,
        pdo_status
    FROM 
        productionOrder 
    WHERE 
        pdo_status != 0
    ORDER BY updated_at DESC   
    `;

    connection.query(query, (err, results) => {
        if (!err) {
            if (results.length > 0) {
                return res.status(200).json(results);
            } else {
                return res.status(404).json({ message: " productionOrder not found" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// router.get('/readone/:pdo_id', (req, res, next) => {
//     const pdo_id  = req.params.pdo_id ;
//     var query = `
//     SELECT 
//     CONCAT('PD', LPAD(pdo.pdo_id, 7, '0')) AS pdo_id_name,
//     DATE_FORMAT(pdo.updated_at, '%Y-%m-%d') AS updated_at,
//     pdod.*, pdc.pdc_name AS pdc_name 
// FROM 
//     productionOrder pdo 
//     JOIN productionOrderdetail pdod ON pdo.pdo_id = pdod.pdo_id 
//     JOIN products pd ON pdod.pd_id = pd.pd_id 
//     JOIN productCategory pdc ON pd.pdc_id = pdc.pdc_id 
// WHERE 
//     pdo.pdo_id = ?;

//     `;

//     connection.query(query, [pdo_id], (err, results) => {
//         if (!err) {
//             if (results.length > 0) {
//                 return res.status(200).json(results);

//             } else {
//                 return res.status(404).json({ message: "ingredient not found" });
//             }
//         } else {
//             return res.status(500).json(err);
//         }
//     });
// });

// แบบใช้ sql ไม่ได้ ต้อง อัปเดต something
// router.get('/readone/:pdo_id', (req, res, next) => {
//     const pdo_id = req.params.pdo_id;
//     var query = `
//     SELECT 
//         CONCAT('PD', LPAD(pdo.pdo_id, 7, '0')) AS pdo_id_name,
//         DATE_FORMAT(pdo.updated_at, '%Y-%m-%d') AS updated_at,
//         JSON_ARRAYAGG(JSON_OBJECT(
//             'pdod_id', pdod.pdod_id,
//             'qty', pdod.qty,
//             'status', pdod.status,
//             'pdo_id', pdod.pdo_id,
//             'pd_id', pdod.pd_id,
//             'created_at', pdod.created_at,
//             'deleted_at', pdod.deleted_at,
//             'pdc_name', pdc.pdc_name
//         )) AS pdodetail
//     FROM 
//         productionOrder pdo 
//         JOIN productionOrderdetail pdod ON pdo.pdo_id = pdod.pdo_id 
//         JOIN products pd ON pdod.pd_id = pd.pd_id 
//         JOIN productCategory pdc ON pd.pdc_id = pdc.pdc_id 
//     WHERE 
//         pdo.pdo_id = ? AND pdod.deleted_at IS NULL;`;

//     connection.query(query, [pdo_id], (err, results) => {
//         if (!err) {
//             if (results.length > 0) {
//                 // เพิ่มการแปลงข้อมูล JSON ก่อนส่งคืน
//                 results.forEach(result => {
//                     result.pdodetail = JSON.parse(result.pdodetail);
//                 });
//                 return res.status(200).json(results[0]);
//             } else {
//                 return res.status(404).json({ message: "ingredient not found" });
//             }
//         } else {
//             return res.status(500).json(err);
//         }
//     });
// });

//แบบไม่ใช้ sql
router.get('/readone/:pdo_id', (req, res, next) => {
    try {
        const pdo_id = req.params.pdo_id;

        const query = `
            SELECT 
                pdo.pdo_status as pdo_status,
                CONCAT('PD', LPAD(pdo.pdo_id, 7, '0')) AS pdo_id_name,
                DATE_FORMAT(pdo.updated_at, '%Y-%m-%d') AS updated_at_pdo,
                pdod.*, pdc.pdc_name AS pdc_name ,pd.pd_name as pd_name
            FROM 
                productionOrder pdo 
                JOIN productionOrderdetail pdod ON pdo.pdo_id = pdod.pdo_id 
                JOIN products pd ON pdod.pd_id = pd.pd_id 
                JOIN productCategory pdc ON pd.pdc_id = pdc.pdc_id 
            WHERE 
                pdo.pdo_id = ? AND pdod.deleted_at IS NULL`;

        // const [results] = await connection.query(query, [pdo_id]);
        connection.query(query, pdo_id, (err, results) => {
            if (results.length > 0) {
                const formattedResult = {
                    pdo_id_name: results[0].pdo_id_name,
                    pdo_status: results[0].pdo_status,
                    updated_at: results[0].updated_at_pdo,
                    pdodetail: results.map(item => ({
                        pdod_id: item.pdod_id,
                        qty: item.qty,
                        status: item.status,
                        pdo_id: item.pdo_id,
                        pd_id: item.pd_id,
                        // created_at: item.created_at,
                        // deleted_at: item.deleted_at,
                        pdc_name: item.pdc_name,
                        pd_name: item.pd_name
                    }))
                };

                return res.status(200).json(formattedResult);
            } else {
                return res.status(404).json({ message: "ingredient not found" });
            }
        })
    } catch (error) {
        console.error('Error retrieving pdo:', error);
        return res.status(500).json({ message: 'Error retrieving pdo', error });
    }
});

//edit
router.patch('/editData/:pdo_id', (req, res, next) => {
    const pdo_id = req.params.pdo_id;
    // const dataToEdit = req.body.dataToEdit;
    const dataToEdit = req.body.dataToEdit;

    if (!dataToEdit || dataToEdit.length === 0) {
        return res.status(400).json({ message: "error", error: "No data to edit provided" });
    }
    const query1 = `SELECT pdo_status FROM productionOrder WHERE pdo_id = ?`;

    connection.query(query1, [pdo_id], (err, results) => {
        if (err) {
            console.error("MySQL Query Error:", err);
            // handle error
        }
        const pdo_status = results[0].pdo_status;

        console.log(pdo_status);

        if (pdo_status === '1') {
            // แยกข้อมูลที่ต้องการอัปเดต แยกเป็นข้อมูลที่ต้องการเพิ่ม และข้อมูลที่ต้องการลบ
            const updateData = [];
            const insertData = [];
            const deleteData = [];
            const query = `SELECT productionOrderdetail.pd_id FROM productionOrderdetail WHERE pdo_id = ?`;
            console.log(dataToEdit)

            let pdIdsQ = dataToEdit.map(detail => detail.pd_id).filter(id => id !== undefined);
            console.log(pdIdsQ);
            let pdIds;

            connection.query(query, [pdo_id], (err, results) => {
                if (err) {
                    console.error("MySQL Query Error:", err);
                    // handle error
                }

                // ถ้าไม่มี error, results จะเป็น array ของ object ที่มี key เป็น 'ind_id'
                pdIds = results.map(result => result.pd_id);
                // console.log("indIds:", indIds);

                pdIds.forEach(detail => {
                    //ยังอยู่ตรงนี้
                    // console.log(detail)
                    const selectedData = dataToEdit.filter(item => item.pd_id === detail);
                    // const indIdsNotInIndIdsQdata = dataToEdit.filter(item => item.ind_id === indIdsNotInIndIdsQ);
                    // console.log("for insert indIdsNotInIndIdsQdata",indIdsNotInIndIdsQdata)

                    console.log("for up selectedData", selectedData)

                    // console.log("for insert indIdsNotInIndIdsQ", indIdsNotInIndIdsQ)

                    if (detail) {
                        // ตรวจสอบว่า ind_id มีอยู่ในฐานข้อมูลหรือไม่
                        // const query = `SELECT ingredient_lot_detail.ind_id FROM ingredient_lot_detail WHERE indl_id = ?`;

                        if (pdIdsQ.includes(detail)) {
                            // ind_id มีอยู่ในฐานข้อมูล ให้ทำการอัปเดต
                            console.log("Update data:", selectedData);
                            updateData.push(selectedData);
                        } else {
                            if (pdIds) {
                                // ind_id ไม่มีอยู่ในฐานข้อมูล ให้ทำการลบ
                                console.log("delete data:", detail);
                                deleteData.push(detail);
                            } else {
                                // ind_id ไม่ได้ระบุ ให้ทำการเพิ่ม
                                //ไม่ทำงาน
                                //ค่อยคิด
                                console.log("nonono insert data:", selectedData);
                                insertData.push(selectedData);
                            }
                        }

                    } else {
                        // ind_id ไม่ได้ระบุ ให้ทำการเพิ่ม
                        //ค่อยคิด
                        console.log(detail)
                        insertData.push(detail);
                    }
                });

                const pdIdsNotInpdIdsQ = pdIdsQ.filter(id => !pdIds.includes(id));
                console.log(pdIdsNotInpdIdsQ)

                if (pdIdsNotInpdIdsQ != []) {
                    pdIdsNotInpdIdsQ.forEach(detail => {
                        console.log(detail)
                        const pdIdsNotInpdIdsQdata = dataToEdit.filter(item => item.pd_id === detail);
                        console.log("Insert data:", pdIdsNotInpdIdsQ);
                        insertData.push(pdIdsNotInpdIdsQdata);
                    });

                }
                console.log(deleteData, insertData, updateData)
                // indIdsQ.forEach(detail => {

                //     console.log(detail)
                //     const selectedData = dataToEdit.filter(item => item.ind_id === detail);

                // });
                console.log("de length", deleteData.length)
                console.log("in length", insertData.length)
                console.log("ed length", updateData.length)
                if (deleteData.length > 0) {
                    // const deleteQuery = "DELETE FROM Ingredient_lot_detail WHERE ind_id = ? AND indl_id = ?";
                    const deleteQuery = "UPDATE productionOrderdetail SET deleted_at = CURRENT_TIMESTAMP WHERE pd_id = ? AND pdo_id = ?";
                    deleteData.forEach(detail => {
                        const deleteValues = [detail, pdo_id];
                        console.log(deleteValues)

                        connection.query(deleteQuery, deleteValues, (err, results) => {
                            if (err) {
                                console.error("MySQL Delete Query Error:", err);
                                return res.status(500).json({ message: "error", error: err });
                            }

                            console.log("Deleted data:", results);
                        });
                    });
                }

                // ตรวจสอบว่ามีข้อมูลที่ต้องการเพิ่มหรือไม่
                if (insertData.length > 0) {
                    console.log("database inn", insertData)
                    console.log("pdo id", pdo_id)
                    const insertQuery = "INSERT INTO productionOrderdetail (pd_id,qty, status, pdo_id , deleted_at) VALUES (?,?,?,?,?)";

                    const flattenedineData = insertData.flat();
                    console.log("flattenedineData", flattenedineData)

                    flattenedineData.forEach(detail => {
                        const insertValues = [
                            detail.pd_id,
                            detail.qty,
                            1,
                            pdo_id,
                            null // กำหนดให้ deleted_at เป็น null
                        ];

                        connection.query(insertQuery, insertValues, (err, results) => {
                            if (err) {
                                console.error("MySQL Insert Query Error:", err);
                                return res.status(500).json({ message: "error", error: err });
                            }

                            console.log("Inserted data:", results);
                        });
                    });


                }

                // ตรวจสอบว่ามีข้อมูลที่ต้องการอัปเดตหรือไม่
                // console.log("updateData",updateData)
                if (updateData.length > 0) {
                    console.log("database uppp", updateData)
                    // const updateQuery = "UPDATE Ingredient_lot_detail SET qtypurchased = ?, date_exp = ?, price = ? WHERE ind_id = ? AND indl_id = ?";
                    const updateQuery = "UPDATE productionOrderdetail SET qty = ?, status = 1, deleted_at = NULL WHERE pd_id = ? AND pdo_id = ?";
                    //การใช้ flat() จะช่วยให้คุณได้ array ที่ flatten แล้วที่มี object ภายใน ซึ่งจะทำให้ง่ายต่อการทำงานกับข้อมูลในลำดับถัดไป.
                    const flattenedUpdateData = updateData.flat();
                    console.log("flattenedUpdateData", flattenedUpdateData)
                    flattenedUpdateData.forEach(detail => {
                        const updateValues = [
                            detail.qty,
                            detail.pd_id,
                            pdo_id
                        ];

                        connection.query(updateQuery, updateValues, (err, results) => {
                            if (err) {
                                console.error("MySQL Update Query Error:", err);
                                return res.status(500).json({ message: "error", error: err });
                            }

                            console.log("Updated data:", results);
                        });
                    });

                }

                res.status(200).json({ message: "test เงื่อนไข" });
            });
        } else {
            return res.status(500).json({ message: "status != 1" });
        }
    });
});

// router.patch('/updatestatus/:pdo_id', (req, res, next) => {
//     const pdo_id = req.params.pdo_id;
//     var query = "UPDATE productionOrder SET pdo_status=2 WHERE pdo_id=?";
//     connection.query(query, [ pdo_id], (err, results) => {
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

//ยืนยันการผลิต 2=กำลังดำเนินการผลิต
router.patch('/updatestatus/:pdo_id', (req, res, next) => {
    const pdo_id = req.params.pdo_id;


    // Update pdo_status in productionOrder table
    var updateProductionOrderQuery = "UPDATE productionOrder SET pdo_status = 2 WHERE pdo_id = ?";
    connection.query(updateProductionOrderQuery, [pdo_id], (err, results) => {
        if (err) {
            console.error("Error updating pdo_status in productionOrder:", err);
            return res.status(500).json(err);
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Production order not found" });
        }

        // Update pdod_status in productionOrderdetail table
        var updateProductionOrderDetailQuery = "UPDATE productionOrderdetail SET status = 2 WHERE pdo_id = ?";
        connection.query(updateProductionOrderDetailQuery, [pdo_id], (detailErr, detailResults) => {
            if (detailErr) {
                console.error("Error updating pdod_status in productionOrderdetail:", detailErr);
                return res.status(500).json(detailErr);
            }

            return res.status(200).json({ message: "Update success" });
        });
    });
});

//แก้ไขให้=3 เสร็จสิ้นแล้วสำหรับรายละเอียดบางอัน
// router.patch('/updatestatusdetail/:pdo_id', (req, res, next) => {
//     const pdod_id = req.params.pdo_id;


//     // Update pdo_status in productionOrder table
//     // Update pdod_status in productionOrderdetail table
//     var updateProductionOrderDetailQuery = "UPDATE productionOrderdetail SET status = 2 WHERE pdod_id = ?";
//     connection.query(updateProductionOrderDetailQuery, [pdod_id], (detailErr, detailResults) => {
//         if (detailErr) {
//             console.error("Error updating pdod_status in productionOrderdetail:", detailErr);
//             return res.status(500).json(detailErr);
//         }

//         return res.status(200).json({ message: "Update success" });
//     });
// });

//ให้เป็นเสร็จสิ้น ส่งเป็นลิสท์
// router.patch('/updatestatusdetail',  (req, res, next) => {
//     const pdod_ids = req.body.pdod_ids; // รับ array หรือ list ของ pdod_id ที่ต้องการแก้ไข

//     if (!pdod_ids || pdod_ids.length === 0) {
//         return res.status(400).json({ message: "No pdod_id provided" });
//     }

//     // Update pdod_status in productionOrderdetail table for each pdod_id in the array
//     const updateQueries = pdod_ids.map(pdod_id => {
//         return new Promise((resolve, reject) => {
//             var updateProductionOrderDetailQuery = "UPDATE productionOrderdetail SET status = 3 WHERE pdod_id = ?";
//             connection.query(updateProductionOrderDetailQuery, [pdod_id], (detailErr, detailResults) => {
//                 if (detailErr) {
//                     console.error("Error updating pdod_status in productionOrderdetail:", detailErr);
//                     reject(detailErr); // Reject หากเกิดข้อผิดพลาดในการอัปเดต
//                 } else {
//                     resolve(detailResults); // Resolve หากอัปเดตสำเร็จ
//                 }
//             });
//         });
//     });

//     // รวม Promise ของการอัปเดตทุก pdod_id และรอให้ทุก Promise เสร็จสิ้น
//     Promise.all(updateQueries)
//         .then(() => {
//             return res.status(200).json({ message: "Update success" });
//         })
//         .catch(err => {
//             return res.status(500).json(err); // คืนค่า error หากมีข้อผิดพลาดในการอัปเดต
//         });
// });







router.patch('/updatestatusdetail', (req, res, next) => {
    const pdod_ids = req.body.pdod_ids; // รับ array หรือ list ของ pdod_id ที่ต้องการแก้ไข
    const pdo_id = req.body.pdo_id;

    if (!pdod_ids || pdod_ids.length === 0) {
        return res.status(400).json({ message: "No pdod_id provided" });
    }

    // Initialize a counter to track the number of completed queries
    let completedQueries = 0;
    let hasErrorOccurred = false;

    pdod_ids.forEach(pdod_id => {
        var updateProductionOrderDetailQuery = "UPDATE productionOrderdetail SET status = 3 WHERE pdod_id = ?";
        connection.query(updateProductionOrderDetailQuery, [pdod_id], (detailErr, detailResults) => {
            if (detailErr) {
                console.error("Error updating pdod_status in productionOrderdetail:", detailErr);
                if (!hasErrorOccurred) {
                    hasErrorOccurred = true;
                    return res.status(500).json(detailErr); // Return the error if one occurs
                }
            } else {
                completedQueries++;
                if (completedQueries === pdod_ids.length && !hasErrorOccurred) {
                    console.log(pdo_id,"pdo_id")
                    Status3(pdo_id)
                    return res.status(200).json({ message: "Update success" }); // All queries completed successfully
                }
            }
        });
    });
});

const Status3 = async (pdo_id) => {
    console.log("Checking and updating status for pdo_id:", pdo_id);
    try {
        // Query to get the status of the production order and its details
        const query = `
            SELECT

                pdo.pdo_status as pdo_status,
                pdod.status as pdode_status
            FROM 
                productionOrder as pdo
            LEFT JOIN 
                productionOrderdetail AS pdod ON pdod.pdo_id = pdo.pdo_id
            WHERE  
                pdo.pdo_id = ?
        `;

        // Fetch the results
        const [results] = await connection.promise().query(query, [pdo_id]);

        // Extract statuses from the results
        const statuses = results.map(item => item.pdode_status);
        console.log("statuses",statuses)
        // Check if all statuses are 3
        const allStatusesAreThree = statuses.every(status => status === '3' || status === 3);
        console.log("allStatusesAreThree",allStatusesAreThree)

        if (allStatusesAreThree) {
            // Update the status in productionOrder if all details have status 3
            const updateQuery = "UPDATE productionOrder SET pdo_status = 3 WHERE pdo_id = ?";
            await connection.promise().query(updateQuery, [pdo_id]);
            console.log(`Updated status to 3 for pdo_id: ${pdo_id}`);
        } else {
            // Log the current statuses if not all are 3
            console.log(`Statuses for pdo_id ${pdo_id}:`, statuses);
        }

    } catch (error) {
        console.error('MySQL Error:', error);
    }
};


//เพิ่มวัตถุดิบที่ใช้ตามผลิต

router.post('/addUseIngrediantnew', (req, res, next) => {
    const ingredient_Used = req.body.ingredient_Used;
    const ingredient_Used_detail = req.body.ingredient_Used_detail;


    // const query = "INSERT INTO ingredient_Used (status, note) VALUES (?, ?)";
    // connection.query(query, [ingredient_Used.status, ingredient_Used.note], (err, results) => {
    //     return res.status(500).json({ message: "error", error: err });
    //     }
    // });
});


//เอาไว้ก่อน
// สร้างฟังก์ชัน calculateMaterialCost คำนวณต้นทุนต่อ 1 วัตถุดิบ
function calculateMaterialCost(quantity, price, totalQuantity) {
    // คำนวณต้นทุนวัตถุดิบ
    const materialCost = (quantity * (price / totalQuantity)).toFixed(2);

    // ส่งค่าต้นทุนวัตถุดิบกลับ
    return { materialCost };
}


module.exports = router;