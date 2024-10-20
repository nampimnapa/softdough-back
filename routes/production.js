const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder } = require('../middleware')

router.post('/adddis', (req, res, next) => {
    let Data = req.body;
    console.log('Body:', req.body); // Check request body

    const query = `
        INSERT INTO discount (dc_name, dc_detail, dc_diccountprice, datestart, dateend,minimum,deleted_at)
        VALUES (?, ?, ?, ?, ?,?,?);
    `;
    const values = [
        Data.dc_name,
        Data.dc_detail,
        Data.dc_diccountprice,
        Data.datestart,
        Data.dateend,
        Data.minimum,
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

router.get('/readdis', (req, res, next) => {
    var query = 'select *,DATE_FORMAT(discount.datestart, "%d-%m-%Y") AS datestart,DATE_FORMAT(discount.dateend, "%d-%m-%Y") AS dateend from discount'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})

router.get('/readdis/:id', (req, res, next) => {
    const id = req.params.id;
    var query = `SELECT discount.*, 
    DATE_FORMAT(datestart, '%Y-%m-%d') AS datestart,
    DATE_FORMAT(dateend, '%Y-%m-%d') AS dateend
     FROM discount WHERE dc_id = ?`;

    connection.query(query, [id], (err, results) => {
        if (!err) {
            if (results.length > 0) {
                return res.status(200).json(results[0]);
            } else {
                return res.status(404).json({ message: "Staff not found" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});


router.patch('/update/:id', (req, res, next) => {
    const dc_id = req.params.id;
    const discount = req.body;


    var query = "UPDATE discount SET dc_name=?, dc_detail=?, dc_diccountprice=?, datestart=?, dateend=? ,minimum=? ,updated_at=CURRENT_TIMESTAMP() WHERE dc_id=?";
    connection.query(query, [discount.dc_name, discount.dc_detail, discount.dc_diccountprice, discount.datestart, discount.dateend, discount.minimum, dc_id], (err, results) => {
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



//addpro free
//   router.post('/addfree', (req, res, next) => {
//     // const ingredient_lot = req.body;
//     // const ingredient_lot_detail = req.body;
//     // const promotion = req.body.promotion[0]; // Access the first item in the productionOrder array
//     const { pm_name, pm_datestart, pm_dateend, promotiondetail } = req.body;
//     // const promotiondetail = req.body.promotiondetail;


//     const query = "INSERT INTO promotion (pm_name ,pm_datestart,pm_dateend,deleted_at) VALUES (?,?,?,null)";

//     connection.query(query, [pm_name,pm_datestart,pm_dateend], (err, results) => {

//         if (!err) {
//             const pmd_id = results.insertId;

//             const values = promotiondetail.map(detail => [
//                 detail.pm_id,
//                 detail.smbuy_id,
//                 detail.smfree_id,
//                 null // กำหนดให้ deleted_at เป็น null
//             ]);

//             const detailQuery = `
//                 INSERT INTO promotiondetail (pm_id, smbuy_id, smfree_id, deleted_at) 
//                 VALUES ?
//             `;

//             connection.query(detailQuery, [values], (err, results) => {
//                 if (err) {
//                     console.error("MySQL Error:", err);
//                     return res.status(500).json({ message: "error", error: err });
//                 } else {
//                     return res.status(200).json({ message: "success", pmd_id });
//                 }
//             });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });

// });

//เพิ่ม transaction 
router.post('/addfree', (req, res, next) => {
    const { pm_name, pm_datestart, pm_dateend, promotiondetail } = req.body;

    // Start the transaction
    connection.beginTransaction((err) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        const query = "INSERT INTO promotion (pm_name, pm_datestart, pm_dateend, deleted_at) VALUES (?,?,?,null)";

        connection.query(query, [pm_name, pm_datestart, pm_dateend], (err, results) => {
            if (err) {
                return connection.rollback(() => {
                    console.error("MySQL Error:", err);
                    return res.status(500).json({ message: "error", error: err });
                });
            }

            const pm_id = results.insertId;

            // Flatten the arrays into pairs
            const values = promotiondetail.flatMap(detail =>
                detail.smbuy_id.flatMap(smbuy_id =>
                    detail.smfree_id.map(smfree_id => [
                        pm_id,
                        smbuy_id,
                        smfree_id,
                        null
                    ])
                )
            );

            const detailQuery = `
                INSERT INTO promotiondetail (pm_id, smbuy_id, smfree_id, deleted_at) 
                VALUES ?
            `;

            connection.query(detailQuery, [values], (err, results) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error("MySQL Error:", err);
                        return res.status(500).json({ message: "error", error: err });
                    });
                }

                // Commit the transaction
                connection.commit((err) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error("MySQL Error:", err);
                            return res.status(500).json({ message: "error", error: err });
                        });
                    }

                    return res.status(200).json({ message: "success", pm_id });
                });
            });
        });
    });
});
;

router.get('/readfree', (req, res, next) => {
    const query = `
    SELECT 
        p.pm_id,
        p.pm_name,
        DATE_FORMAT(p.pm_datestart, '%Y-%m-%d') AS pm_datestart,
        DATE_FORMAT(p.pm_dateend, '%Y-%m-%d') AS pm_dateend,
        pd.pmd_id,
        pd.smbuy_id,
        pd.smfree_id,
        smbuy.sm_name AS smbuy_idnamet,
        smfree.sm_name AS smfree_idnamet,
        smbuytype.smt_name AS smtbuy_idnamet,
        smfreetype.smt_name AS smtfree_idnamet
    FROM 
        promotion p
    JOIN 
        promotiondetail pd ON p.pm_id = pd.pm_id
    JOIN 
        salesMenu smbuy ON pd.smbuy_id = smbuy.sm_id
    JOIN 
        salesMenu smfree ON pd.smfree_id = smfree.sm_id
    JOIN 
        salesMenuType smbuytype ON smbuy.smt_id = smbuytype.smt_id
    JOIN 
        salesMenuType smfreetype ON smfree.smt_id = smfreetype.smt_id;

    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }

        // Group by pm_id
        const groupedResults = results.reduce((acc, item) => {
            if (!acc[item.pm_id]) {
                acc[item.pm_id] = {
                    pm_id: item.pm_id,
                    pm_name: item.pm_name,
                    pm_datestart: item.pm_datestart,
                    pm_dateend: item.pm_dateend,
                    detail: []
                };
            }

            acc[item.pm_id].detail.push({
                smbuy_id: item.smbuy_id,
                smfree_id: item.smfree_id,
                smbuy_idnamet: item.smbuy_idnamet,
                smfree_idnamet: item.smfree_idnamet,
                smbuytype: item.smtbuy_idnamet,
                smfreetype: item.smtfree_idnamet
            });

            return acc;
        }, {});

        // Convert the groupedResults object to an array
        const formattedResults = Object.values(groupedResults);

        return res.status(200).json(formattedResults);
    });
});

router.get('/readfreedetail/:pm_id', async (req, res, next) => {
    const pm_id = Number(req.params.pm_id);

    const query = `
    SELECT 
        p.pm_id,
        p.pm_name,
        DATE_FORMAT(p.pm_datestart, '%Y-%m-%d') AS pm_datestart,
        DATE_FORMAT(p.pm_dateend, '%Y-%m-%d') AS pm_dateend,
        pd.pmd_id,
        pd.smbuy_id,
        pd.smfree_id,
        smbuy.sm_name AS smbuy_idnamet,
        smfree.sm_name AS smfree_idnamet,
        smbuytype.smt_name AS smtbuy_idnamet,
        smfreetype.smt_name AS smtfree_idnamet
    FROM 
        promotion p
    JOIN 
        promotiondetail pd ON p.pm_id = pd.pm_id
    JOIN 
        salesMenu smbuy ON pd.smbuy_id = smbuy.sm_id
    JOIN 
        salesMenu smfree ON pd.smfree_id = smfree.sm_id
    JOIN 
        salesMenuType smbuytype ON smbuy.smt_id = smbuytype.smt_id
    JOIN 
        salesMenuType smfreetype ON smfree.smt_id = smfreetype.smt_id
    WHERE 
        p.pm_id = ? AND pd.deleted_at IS NULL;
    
    `;

    connection.query(query, [pm_id], (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }

        // Group by pm_id
        const groupedResults = results.reduce((acc, item) => {
            if (!acc[item.pm_id]) {
                acc[item.pm_id] = {
                    pm_id: item.pm_id,
                    pm_name: item.pm_name,
                    pm_datestart: item.pm_datestart,
                    pm_dateend: item.pm_dateend,
                    detail: []
                };
            }

            acc[item.pm_id].detail.push({
                smbuy_id: item.smbuy_id,
                smfree_id: item.smfree_id,
                smbuy_idnamet: item.smbuy_idnamet,
                smfree_idnamet: item.smfree_idnamet,
                smbuytype: item.smtbuy_idnamet,
                smfreetype: item.smtfree_idnamet
            });

            return acc;
        }, {});

        // Convert the groupedResults object to an array
        const formattedResults = Object.values(groupedResults);

        return res.status(200).json(formattedResults);
    });
});

// 
//ไม่ได้ค่าคุรน้า ไปถามใหม่แบบให้นับแถวที่มีของ idpm นั้น แล้วแก้ไขเลย เกินก็ลบ ขาดก็เพิ่ม
// ตอนนี้มันลบไปเลย ไม่ใช่ sd แล้วลบหมดแอดใหม่เอา ซึ่งถ้าทำการขายน่าจะบ่ได้เด้อค่าเว้นแต่เก็บเพิ่มในออเดอร์เอา

//ยังไม่ลองข้อมูลสินค้าให้ว่าง
// router.put('/updatefree', (req, res, next) => {
//     const { pm_id, pm_name, pm_datestart, pm_dateend, promotiondetail } = req.body;
//     console.log(promotiondetail,'promotiondetail')

//     // Start the transaction
//     connection.beginTransaction((err) => {
//         if (err) {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }

//         // Update the promotion table
//         const updateQuery = `
//             UPDATE promotion 
//             SET pm_name = ?, pm_datestart = ?, pm_dateend = ? 
//             WHERE pm_id = ?
//         `;

//         connection.query(updateQuery, [pm_name, pm_datestart, pm_dateend, pm_id], (err, results) => {
//             if (err) {
//                 return connection.rollback(() => {
//                     console.error("MySQL Error:", err);
//                     return res.status(500).json({ message: "error", error: err });
//                 });
//             }

//             // Delete all old promotion details for the given pm_id
//             // const deleteOldDetailsQuery = `
//             //     DELETE FROM promotiondetail 
//             //     WHERE pm_id = ?
//             // `;

//             // connection.query(deleteOldDetailsQuery, [pm_id], (err, results) => {
//             //     if (err) {
//             //         return connection.rollback(() => {
//             //             console.error("MySQL Error:", err);
//             //             return res.status(500).json({ message: "error", error: err });
//             //         });
//             //     }
            
//             //เปลี่ยนมาเป็น sd ยังไม่เทส
//             const softDeleteQuery = `
//             UPDATE promotiondetail 
//             SET deleted_at = NOW() 
//             WHERE pm_id = ?
//         `;

//             connection.query(softDeleteQuery, [pm_id], (err, results) => {
//                 if (err) {
//                     return connection.rollback(() => {
//                         console.error("MySQL Error:", err);
//                         return res.status(500).json({ message: "error", error: err });
//                     });
//                 }
//                 // Prepare new details to insert
//                 const newDetails = promotiondetail.flatMap(detail =>
//                     detail.smbuy_id.flatMap(smbuy_id =>
//                         detail.smfree_id.map(smfree_id => [
//                             pm_id,
//                             smbuy_id,
//                             smfree_id,
//                             null // Adding NULL for the deleted_at column
//                         ])
//                     )
//                 );

//                 // Insert the new details
//                 const insertQuery = `
//                     INSERT INTO promotiondetail (pm_id, smbuy_id, smfree_id, deleted_at) 
//                     VALUES ?
//                 `;

//                 connection.query(insertQuery, [newDetails], (err, results) => {
//                     if (err) {
//                         return connection.rollback(() => {
//                             console.error("MySQL Error:", err);
//                             return res.status(500).json({ message: "error", error: err });
//                         });
//                     }

//                     // Commit the transaction
//                     connection.commit((err) => {
//                         if (err) {
//                             return connection.rollback(() => {
//                                 console.error("MySQL Error:", err);
//                                 return res.status(500).json({ message: "error", error: err });
//                             });
//                         }

//                         return res.status(200).json({ message: "success", pm_id });
//                     });
//                 });
//             });
//         });
//     });
// });

router.put('/updatefree', (req, res, next) => {
    const { pm_id, pm_name, pm_datestart, pm_dateend, promotiondetail } = req.body;
    console.log(promotiondetail, 'promotiondetail');

    // เริ่มต้นธุรกรรม
    connection.beginTransaction((err) => {
        if (err) {
            console.error("ข้อผิดพลาด MySQL:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        // อัปเดตตารางโปรโมชั่น
        const updateQuery = `
            UPDATE promotion 
            SET pm_name = ?, pm_datestart = ?, pm_dateend = ? 
            WHERE pm_id = ?
        `;

        connection.query(updateQuery, [pm_name, pm_datestart, pm_dateend, pm_id], (err, results) => {
            if (err) {
                return connection.rollback(() => {
                    console.error("ข้อผิดพลาด MySQL:", err);
                    return res.status(500).json({ message: "error", error: err });
                });
            }

            // ตรวจสอบว่า promotiondetail มี smbuy_id และ smfree_id ว่างเปล่าหรือไม่
            const allEmpty = promotiondetail.every(detail => detail.smbuy_id.length === 0 && detail.smfree_id.length === 0);

            if (!allEmpty) {
                // อัปเดตข้อมูลโปรโมชั่นเดิม
                const softDeleteQuery = `
                    UPDATE promotiondetail 
                    SET deleted_at = NOW() 
                    WHERE pm_id = ?
                `;

                connection.query(softDeleteQuery, [pm_id], (err, results) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error("ข้อผิดพลาด MySQL:", err);
                            return res.status(500).json({ message: "error", error: err });
                        });
                    }

                    // เตรียมรายละเอียดใหม่ที่จะนำเข้า
                    const newDetails = promotiondetail.flatMap(detail =>
                        detail.smbuy_id.flatMap(smbuy_id =>
                            detail.smfree_id.map(smfree_id => [
                                pm_id,
                                smbuy_id,
                                smfree_id,
                                null // เพิ่ม NULL สำหรับคอลัมน์ deleted_at
                            ])
                        )
                    );

                    // นำเข้ารายละเอียดใหม่
                    const insertQuery = `
                        INSERT INTO promotiondetail (pm_id, smbuy_id, smfree_id, deleted_at) 
                        VALUES ?
                    `;

                    connection.query(insertQuery, [newDetails], (err, results) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error("ข้อผิดพลาด MySQL:", err);
                                return res.status(500).json({ message: "error", error: err });
                            });
                        }

                        // ยืนยันธุรกรรม
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    console.error("ข้อผิดพลาด MySQL:", err);
                                    return res.status(500).json({ message: "error", error: err });
                                });
                            }

                            return res.status(200).json({ message: "success", pm_id });
                        });
                    });
                });
            } else {
                // หาก smbuy_id และ smfree_id ว่างเปล่า ให้ยืนยันธุรกรรมโดยไม่ทำการเปลี่ยนแปลง
                connection.commit((err) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error("ข้อผิดพลาด MySQL:", err);
                            return res.status(500).json({ message: "error", error: err });
                        });
                    }

                    return res.status(200).json({ message: "success", pm_id });
                });
            }
        });
    });
});









module.exports = router;