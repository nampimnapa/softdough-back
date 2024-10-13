const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { isALL, ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder, } = require('../middleware')
const frontUrl = process.env.FRONT;

//แจ้งเตือน
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(express);
const io = socketIo(server, {
    cors: {
        origin: frontUrl,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});


router.post('/unit', (req, res, next) => {
    const units = req.body;

    // Prepare the query with placeholders
    const query = "INSERT INTO unit (un_name, type) VALUES (?, ?)";

    // Combine all the insertion tasks into a single array of promises
    const insertionPromises = [];

    // Loop through each type in the units object
    for (const type in units) {
        if (units.hasOwnProperty(type)) {
            const details = units[type].detail;

            // Loop through each un_name in the details array
            details.forEach(un_name => {
                // Create a promise for each insertion and push it into the array
                insertionPromises.push(new Promise((resolve, reject) => {
                    connection.query(query, [un_name, type], (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    });
                }));
            });
        }
    }

    // Execute all insertions in parallel and wait for them to complete
    Promise.all(insertionPromises)
        .then(() => {
            return res.status(200).json({ message: "success" });
        })
        .catch(err => {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        });
});
// ------------------------------------------วัตถุดิบ-----------------------------------------
//เพิ่มวัตถุดิบ
router.post('/add', (req, res, next) => {
    let ingredientData = req.body;
    let ind_stock = 0; // ตั้งค่าเริ่มต้นเป็น 0

    // กำหนดค่า status เป็น 'ไม่มี'
    let status = "0";

    const query = `
        INSERT INTO ingredient (ind_name, un_purchased, qtyminimum, un_ind, qty_per_unit, ind_stock, status)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
        ingredientData.ind_name,
        ingredientData.un_purchased,
        ingredientData.qtyminimum,
        ingredientData.un_ind,
        ingredientData.qty_per_unit,
        ind_stock,
        status,
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

//อ่านวัตถุดิบทั้งหมด เก่าาาาาาา 
router.get('/read', (req, res, next) => {
    Updateqtystock()
    var query = `
    SELECT ingredient.*, 
           unit1.un_name AS un_purchased_name,
           unit2.un_name AS un_ind_name 
    FROM ingredient 
    LEFT JOIN unit AS unit1 ON ingredient.un_purchased = unit1.un_id
    LEFT JOIN unit AS unit2 ON ingredient.un_ind = unit2.un_id
`;

    //LEFT JOIN แทน JOIN เพื่อให้ข้อมูลจากตาราง ingredient แสดงออกมาทั้งหมด แม้ว่าข้อมูลใน unit อาจจะไม่ตรงกับเงื่อนไขใน JOIN

    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});


const Updateqtystock = async () => {
    console.log("Updating stock quantities");
    try {
        const query = `
            SELECT 
                ingredient.ind_id,
                SUM(ingredient_lot_detail.qty_stock) AS total_stock,
                ingredient.ind_name,
                (SUM(ingredient_lot_detail.qty_stock) DIV ingredient.qty_per_unit) AS ind_stock,
                unit1.un_name AS un_purchased_name,
                unit2.un_name AS un_ind_name,
                ingredient.status,
                ingredient.qtyminimum
            FROM 
                ingredient 
            LEFT JOIN 
                unit AS unit1 ON ingredient.un_purchased = unit1.un_id
            LEFT JOIN 
                unit AS unit2 ON ingredient.un_ind = unit2.un_id
            LEFT JOIN 
                ingredient_lot_detail ON ingredient.ind_id = ingredient_lot_detail.ind_id
            LEFT JOIN 
                ingredient_lot ON ingredient_lot_detail.indl_id = ingredient_lot.indl_id
            WHERE  
                ingredient_lot.status = 2
            AND 
                ingredient_lot_detail.deleted_at IS NULL
            GROUP BY 
                ingredient_lot_detail.ind_id
        `;

        const [results] = await connection.promise().query(query);
        
        const updateQuery = "UPDATE ingredient SET ind_stock = ?, status = ? WHERE ind_id = ?";
        const updatePromises = results.map(item => {
            const newStock = item.ind_stock;
            const newStatus = newStock <= item.qtyminimum ? 1 : 2;
            const updateValues = [newStock, newStatus, item.ind_id];

            console.log("Updating data:", updateValues);

            return connection.promise().query(updateQuery, updateValues);
        });

        await Promise.all(updatePromises);

        console.log("All stock quantities updated successfully");
    } catch (error) {
        console.error('MySQL Error:', error);
    }
};

//ลองแบบรวม detaillot เอา stock ของ detail มาบวก
router.get('/readall', (req, res, next) => {
    var query = `
    SELECT 
        ingredient.ind_id,
        SUM(ingredient_lot_detail.qty_stock) AS total_stock,
        ingredient.ind_name,
        (SUM(ingredient_lot_detail.qty_stock) DIV ingredient.qty_per_unit) AS ind_stock, unit1.un_name AS un_purchased_name,
        unit2.un_name AS un_ind_name ,
        ingredient.status,
        ingredient.qtyminimum
    FROM 
        ingredient 
    LEFT JOIN 
        unit AS unit1 ON ingredient.un_purchased = unit1.un_id
    LEFT JOIN 
        unit AS unit2 ON ingredient.un_ind = unit2.un_id
    LEFT JOIN 
        ingredient_lot_detail ON ingredient.ind_id = ingredient_lot_detail.ind_id
    LEFT JOIN 
        ingredient_lot ON ingredient_lot_detail.indl_id = ingredient_lot.indl_id
    WHERE 
        ingredient_lot.status = 2
    AND 
        ingredient_lot_detail.deleted_at IS NULL
    GROUP BY 
        ingredient_lot_detail.ind_id
`;
    connection.query(query, (err, results) => {
        if (!err) {
            // return res.status(200).json(results);
            const updateQuery = "UPDATE ingredient SET ind_stock = ? WHERE ind_id = ?";
            console.log("results", results);

            results.forEach(item => {
                const updateValues = [item.total_stock, item.ind_id]; // เข้าถึงข้อมูลด้วยชื่อของ properties

                console.log("item data:", item.total_stock, item.ind_id);

                connection.query(updateQuery, updateValues, (err, result) => {
                    if (err) {
                        console.error("MySQL Update Query Error:", err);
                        return res.status(500).json({ message: "error", error: err });
                    }

                    console.log("Updated data:", result);
                });
            });

            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});



// router.get('/read/:id', (req, res, next) => {
//     const ind_id = req.params.id;
//     var query = 'SELECT * FROM ingredient WHERE ind_id = ?';

//     connection.query(query, [ind_id], (err, results) => {
//         if (!err) {
//             if (results.length > 0) {
//                 return res.status(200).json(results[0]);
//             } else {
//                 return res.status(404).json({ message: "ingredient not found" });
//             }
//         } else {
//             return res.status(500).json(err);
//         }
//     });
//   });


// อ่านวัตถุดิบที่เลือก
router.get('/read/:id', (req, res, next) => {
    const ind_id = req.params.id;
    var query = `
    SELECT ingredient.*, 
    unit1.un_name AS un_purchased_name,
    unit2.un_name AS un_ind_name 
FROM ingredient 
LEFT JOIN unit AS unit1 ON ingredient.un_purchased = unit1.un_id
LEFT JOIN unit AS unit2 ON ingredient.un_ind = unit2.un_id
WHERE ingredient.ind_id = ?;  -- Fixed the alias here
    `;

    connection.query(query, [ind_id], (err, results) => {
        if (!err) {
            if (results.length > 0) {
                return res.status(200).json(results[0]);
            } else {
                return res.status(404).json({ message: "ingredient not found" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

//หน่วยวัตถุดิบ
// ให้มีtype of unit
router.get('/unit',  (req, res, next) => {
    var query = 'select *from unit where type="1"'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})



//เผื่อadd unit เพิ่มเติม
// router.post('/unit', (req, res, next) => {
//     let unit = req.body;
//     query = "insert into unit (un_name,type) values(?,'1')";
//     connection.query(query, [unit.un_name, unit.type], (err, results) => {
//         if (!err) {
//             return res.status(200).json({ message: "success" });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// })

// แก้ไขวัตถุดิบ
router.patch('/update/:id',  (req, res, next) => {
    const ingredientId = req.params.id;
    const ingredientData = req.body;
    // const ind_stock = ingredientData.ind_stock || 0; // ถ้าไม่ได้รับค่า ind_stock ให้เป็น 0

    // ตรวจสอบและกำหนดค่า status หากต้องการ
    // let status = ingredientData.status || "0"; // ถ้าไม่ได้รับค่า status ให้เป็น "0"

    const query = `
        UPDATE ingredient 
        SET ind_name = ?, un_purchased = ?, qtyminimum = ?, un_ind = ?, qty_per_unit = ?, updated_at = CURRENT_TIMESTAMP
        WHERE ind_id = ?;
    `;
    const params = [
        ingredientData.ind_name,
        ingredientData.un_purchased,
        ingredientData.qtyminimum,
        ingredientData.un_ind,
        ingredientData.qty_per_unit,
        ingredientId
    ];

    connection.query(query, params, (err, results) => {
        if (!err) {
            return res.status(200).json({ message: "success" });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
});

// ------------------------------------------วัตถุดิบเข้าร้าน-----------------------------------------

//lot ingrediant
//readlotdetail หน้าดู วัตถุดิบตามล็อต """""ในหน้าวัตถุดิบทั้งหทด"
router.get('/readlotdetail', (req, res, next) => {
    // const indl_id = req.params.id;
    var query = `
    SELECT 
        CONCAT('L', LPAD(il.indl_id, 7, '0')) AS indl_id_name,
        i.ind_name, il.qty_stock,i.qty_per_unit,
        ROUND(il.qty_stock / i.qty_per_unit) AS stock_quantity,
        DATE_FORMAT(il.date_exp, '%Y-%m-%d') AS date_exp
    FROM 
        ingredient_lot_detail il
    JOIN
        ingredient i ON il.ind_id = i.ind_id
    where date_exp >= now()
    `;

    connection.query(query, (err, results) => {
        if (!err) {
            if (results.length > 0) {
                return res.status(200).json(results);
            } else {
                return res.status(404).json({ message: "ingredient lot not found" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// สถานะ lot จาก1 =2 ให้ใช้งานล็อตนั้นได้
router.put('/updateIngredientLotStatus/:id', isAdmin, (req, res, next) => {
    const ingredientLotId = req.params.id;

    // Check if ingredient lot exists
    const checkQuery = "SELECT * FROM ingredient_lot WHERE indl_id = ?";
    connection.query(checkQuery, [ingredientLotId], (err, results) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Ingredient Lot not found" });
        }

        // Update ingredient_lot status to 2
        const updateStatusQuery = "UPDATE ingredient_lot SET status = 2 WHERE indl_id = ?";
        connection.query(updateStatusQuery, [ingredientLotId], (err, results) => {
            if (err) {
                console.error("MySQL Error:", err);
                return res.status(500).json({ message: "error", error: err });
            }

            // Update ingredient stock in ingredient table
            const updateIngredientStockQuery = `
                UPDATE ingredient i
                JOIN ingredient_lot_detail ild ON i.ind_id = ild.ind_id
                SET i.ind_stock = i.ind_stock + ild.qtypurchased
                WHERE ild.indl_id = ?
            `;
            connection.query(updateIngredientStockQuery, [ingredientLotId], (err, results) => {
                if (err) {
                    console.error("MySQL Error:", err);
                    return res.status(500).json({ message: "error", error: err });
                }

                return res.status(200).json({ message: "Ingredient Lot status updated to 2 and ingredient stock updated" });
            });
        });
    });
});


// router.patch('/update/:own_id', (req, res, next) => {
//     const own_id = req.params.own_id;
//     const owner = req.body;
//     var query = "UPDATE owner SET own_username=?, own_password=?, own_name=? WHERE own_id=?";
//     connection.query(query, [owner.own_username, owner.own_password, owner.own_name, own_id], (err, results) => {
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




//ลองรวมใหม่
// router.post('/addLotIngrediantnew', (req, res, next) => {
//     // const ingredient_lot = req.body;
//     // const ingredient_lot_detail = req.body;
//     const ingredient_lot = req.body.ingredient_lot;
//     const ingredient_lot_detail = req.body.ingredient_lot_detail;


//     const query = "INSERT INTO ingredient_lot (indl_id) VALUES (?)";
//     connection.query(query, [ingredient_lot.indl_id], (err, results) => {
//         if (!err) {
//             const indl_id = results.insertId;

//             // const values = ingredient_lot_detail.map(detail => [
//             //     detail.ind_id,
//             //     indl_id,
//             //     detail.qtypurchased,
//             //     detail.date_exp,
//             //     detail.price
//             // ]);

//             // const detailQuery = `
//             //     INSERT INTO ingredient_lot_detail (ind_id, indl_id, qtypurchased, date_exp, price) 
//             //     VALUES ?
//             // `;
//             const values = ingredient_lot_detail.map(detail => [
//                 detail.ind_id,
//                 indl_id,
//                 detail.qtypurchased,
//                 detail.date_exp,
//                 detail.price,
//                 qty_stock,
//                 null // กำหนดให้ deleted_at เป็น null
//             ]);

//             const detailQuery = `
//                 INSERT INTO ingredient_lot_detail (ind_id, indl_id, qtypurchased, date_exp, price, qty_stock, deleted_at) 
//                 VALUES ?
//             `;

//             connection.query(detailQuery, [values], (err, results) => {
//                 if (err) {
//                     console.error("MySQL Error:", err);
//                     return res.status(500).json({ message: "error", error: err });
//                 } else {
//                     return res.status(200).json({ message: "success", indl_id });
//                 }
//             });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });


//addqty_stock ได้
// router.post('/addLotIngrediantnew', (req, res, next) => {
//     const ingredient_lot = req.body.ingredient_lot;
//     const ingredient_lot_detail = req.body.ingredient_lot_detail;

//     const query = "INSERT INTO ingredient_lot (status) VALUES (?)";
//     connection.query(query, [ingredient_lot.status], (err, results) => {
//         if (err) {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }

//         const indl_id = results.insertId;
//         const values = [];

//         ingredient_lot_detail.forEach(detail => {
//             connection.query("SELECT qty_per_unit FROM ingredient WHERE ind_id = ?", [detail.ind_id], (err, results) => {
//                 if (err) {
//                     console.error("MySQL Query Error:", err);
//                     // handle error
//                 } else {
//                     let qty_per_unit = results[0].qty_per_unit;
//                     let qty_stock = qty_per_unit * detail.qtypurchased;

//                     values.push([
//                         detail.ind_id,
//                         indl_id,
//                         detail.qtypurchased,
//                         detail.date_exp,
//                         detail.price,
//                         qty_stock,
//                         null
//                     ]);

//                     if (values.length === ingredient_lot_detail.length) {
//                         const detailQuery = `
//                             INSERT INTO ingredient_lot_detail (ind_id, indl_id, qtypurchased, date_exp, price, qty_stock, deleted_at) 
//                             VALUES ?
//                         `;

//                         connection.query(detailQuery, [values], (err, results) => {
//                             if (err) {
//                                 console.error("MySQL Error:", err);
//                                 return res.status(500).json({ message: "error", error: err });
//                             } else {
//                                 return res.status(200).json({ message: "success", results });
//                             }
//                         });
//                     }
//                 }
//             });
//         });
//     });
// });

// addqty_stock ได้+add stock ใน ind
router.post('/addLotIngrediantnew', (req, res, next) => {
    const ingredient_lot = req.body.ingredient_lot;
    const ingredient_lot_detail = req.body.ingredient_lot_detail;

    const query = "INSERT INTO ingredient_lot (status) VALUES (?)";
    connection.query(query, [ingredient_lot.status], (err, results) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        const indl_id = results.insertId;
        const values = [];
        // let updateIngredientStock = false;
        console.log(ingredient_lot, ingredient_lot_detail)
        ingredient_lot_detail.forEach(detail => {
            connection.query("SELECT qty_per_unit FROM ingredient WHERE ind_id = ?", [detail.ind_id], (err, results) => {
                if (err) {
                    console.error("MySQL Query Error:", err);
                    // handle error
                } else {
                    // console.log(results[0], 'ใช่หรือไม่')
                    let qty_per_unit = results[0].qty_per_unit;
                    let qty_stock = qty_per_unit * detail.qtypurchased;

                    values.push([
                        detail.ind_id,
                        indl_id,
                        detail.qtypurchased,
                        detail.date_exp,
                        detail.price,
                        qty_stock,
                        null
                    ]);

                    if (values.length === ingredient_lot_detail.length) {
                        const detailQuery = `
                            INSERT INTO ingredient_lot_detail (ind_id, indl_id, qtypurchased, date_exp, price, qty_stock, deleted_at) 
                            VALUES ?
                        `;

                        connection.query(detailQuery, [values], (err, result) => {
                            if (err) {
                                console.error("MySQL Error:", err);
                                return res.status(500).json({ message: "error", error: err });
                                //ถ้าทำบวกลบสต๊อกตรงนี้จะหาย
                            } else {
                                // console.log
                                // if (ingredient_lot.status === 2) {
                                //     // const updateIngredientStock = true;
                                //     console.log("values", values)
                                //     const updateIngredientStockQuery = `UPDATE ingredient SET ind_stock = ind_stock + ? WHERE ind_id = ?`;
                                //     values.forEach(detail2 => {
                                //         console.log(detail2, 'detail2')
                                //         connection.query(updateIngredientStockQuery, [detail2[5], detail2[0]], (err, result) => {
                                //             if (err) {
                                //                 console.error("MySQL Error:", err);
                                //             }
                                //             // else{
                                //             //     console.log(result,"result")
                                //             // }
                                //         });

                                //     });
                                // }
                                // if (updateIngredientStock) {
                                //     // Update ingredient stock

                                // }
                                return res.status(200).json({ message: "success", result });
                            }
                        });
                    }
                }
            });
        });
    });
});


//ingredientLotDetails id

router.get('/ingredientLotDetails/:indl_id', (req, res, next) => {
    const indl_id = req.params.indl_id;

    const query = `
        SELECT ingredient_lot_detail.* ,
        ingredientname.ind_name AS ind_name ,
        DATE_FORMAT(date_exp, '%Y-%m-%d') AS date_exp 
        FROM ingredient_lot_detail
        LEFT JOIN ingredient AS ingredientname ON ingredient_lot_detail.ind_id  = ingredientname.ind_id
        WHERE indl_id = ?
    `;

    connection.query(query, [indl_id], (err, results) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        } else {
            return res.status(200).json({ message: "success", data: results });
        }
    });
});


//ใช้ CONCAT ในคำสั่ง SQL เพื่อรวมค่า L กับค่า indl_id และใช้ LPAD เพื่อเติมเลข 0 ให้ครบ 4 ตัวอักษร
//DATE_FORMAT function ของ MySQL
router.get('/readlot', (req, res, next) => {
    var query = `
    SELECT 
        indl_id,
        status,
        CONCAT('L', LPAD(indl_id, 7, '0')) AS indl_id_name,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d') AS updated_at
    FROM ingredient_lot 
    ORDER BY created_at DESC
`;

    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});

//เผื่อแก้ไขมั้งเนี่ย
router.get('/readlot/:id', (req, res, next) => {
    const indl_id = req.params.id;
    var query = `
    SELECT 
        indl_id,
        status,
        CONCAT('L', LPAD(indl_id, 7, '0')) AS indl_id_name,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d') AS updated_at
    FROM 
        ingredient_lot 
    WHERE 
        indl_id = ?
    `;

    connection.query(query, [indl_id], (err, results) => {
        if (!err) {
            if (results.length > 0) {
                return res.status(200).json(results[0]);
            } else {
                return res.status(404).json({ message: "ingredient not found" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});



// edit lot
//ลองตัวใหม่ วิธีใหม่ มั้ง
//ลองเปลี่ยนเป็นวิธีที่ใช้ เพื่อให้คุณสามารถใช้ค่าที่ได้จาก SELECT query ในโปรแกรม Node.js ได้, คุณสามารถทำการประมวลผลผลลัพธ์ที่ได้จาก query นั้นด้วยการใช้ callback function หรือ Promise (ในกรณีที่มีการใช้ library ที่รองรับ Promise) ขึ้นอยู่กับว่าคุณต้องการให้โค้ดของคุณมีโครงสร้างแบบไหน.

// นี่คือตัวอย่างการใช้ callback function: 
// หรือถ้าคุณต้องการใช้ Promise, คุณต้องใช้ library ที่รองรับ Promise เช่น mysql2
//เช็็คได้ละว่ามีกี่ตัว แต่ยังหาวิธีเอาไปใช้ไม่ได้

//ตรวจสอบค่าเก็บไว้ใน updateData = [] insertData = [];  deleteData = []; ได้ละ delete เป็น [] ลองเชื่อมกับ db ดู
//gเหลือinsertData
//ได้แล้ว
// router.patch('/editData/:indl_id', (req, res, next) => {
//     const indl_id = req.params.indl_id;
//     // const dataToEdit = req.body.dataToEdit;
//     const dataToEdit = req.body.dataaToEdit;

//     if (!dataToEdit || dataToEdit.length === 0) {
//         return res.status(400).json({ message: "error", error: "No data to edit provided" });
//     }

//     // แยกข้อมูลที่ต้องการอัปเดต แยกเป็นข้อมูลที่ต้องการเพิ่ม และข้อมูลที่ต้องการลบ
//     const updateData = [];
//     const insertData = [];
//     const deleteData = [];
//     const query = `SELECT ingredient_lot_detail.ind_id FROM ingredient_lot_detail WHERE indl_id = ?`;
//     console.log(dataToEdit)

//     let indIdsQ = dataToEdit.map(detail => detail.ind_id).filter(id => id !== undefined);
//     console.log(indIdsQ);
//     let indIds;

//     connection.query(query, [indl_id], (err, results) => {
//         if (err) {
//             console.error("MySQL Query Error:", err);
//             // handle error
//         }

//         // ถ้าไม่มี error, results จะเป็น array ของ object ที่มี key เป็น 'ind_id'
//         indIds = results.map(result => result.ind_id);
//         // console.log("indIds:", indIds);

//         indIds.forEach(detail => {
//             //ยังอยู่ตรงนี้
//             // console.log(detail)
//             const selectedData = dataToEdit.filter(item => item.ind_id === detail);
//             // const indIdsNotInIndIdsQdata = dataToEdit.filter(item => item.ind_id === indIdsNotInIndIdsQ);
//             // console.log("for insert indIdsNotInIndIdsQdata",indIdsNotInIndIdsQdata)

//             console.log("for up selectedData", selectedData)

//             // console.log("for insert indIdsNotInIndIdsQ", indIdsNotInIndIdsQ)

//             if (detail) {
//                 // ตรวจสอบว่า ind_id มีอยู่ในฐานข้อมูลหรือไม่
//                 // const query = `SELECT ingredient_lot_detail.ind_id FROM ingredient_lot_detail WHERE indl_id = ?`;

//                 if (indIdsQ.includes(detail)) {
//                     // ind_id มีอยู่ในฐานข้อมูล ให้ทำการอัปเดต
//                     console.log("Update data:", selectedData);
//                     updateData.push(selectedData);
//                 } else {
//                     if (indIds) {
//                         // ind_id ไม่มีอยู่ในฐานข้อมูล ให้ทำการลบ
//                         console.log("delete data:", detail);
//                         deleteData.push(detail);
//                     } else {
//                         // ind_id ไม่ได้ระบุ ให้ทำการเพิ่ม
//                         //ไม่ทำงาน
//                         //ค่อยคิด
//                         console.log("nonono insert data:", selectedData);
//                         insertData.push(selectedData);
//                     }
//                 }

//             } else {
//                 // ind_id ไม่ได้ระบุ ให้ทำการเพิ่ม
//                 //ค่อยคิด
//                 console.log(detail)
//                 insertData.push(detail);
//             }
//         });

//         const indIdsNotInIndIdsQ = indIdsQ.filter(id => !indIds.includes(id));
//         console.log(indIdsNotInIndIdsQ)

//         if (indIdsNotInIndIdsQ != []) {
//             indIdsNotInIndIdsQ.forEach(detail => {
//                 console.log(detail)
//                 const indIdsNotInIndIdsQdata = dataToEdit.filter(item => item.ind_id === detail);
//                 console.log("Insert data:", indIdsNotInIndIdsQdata);
//                 insertData.push(indIdsNotInIndIdsQdata);
//             });

//         }
//         console.log(deleteData, insertData, updateData)
//         // indIdsQ.forEach(detail => {

//         //     console.log(detail)
//         //     const selectedData = dataToEdit.filter(item => item.ind_id === detail);

//         // });
//         console.log("de length", deleteData.length)
//         console.log("in length", insertData.length)
//         console.log("ed length", updateData.length)
//         if (deleteData.length > 0) {
//             const deleteQuery = "DELETE FROM Ingredient_lot_detail WHERE ind_id = ? AND indl_id = ?";

//             deleteData.forEach(detail => {
//                 const deleteValues = [detail, indl_id];
//                 console.log(deleteValues)

//                 connection.query(deleteQuery, deleteValues, (err, results) => {
//                     if (err) {
//                         console.error("MySQL Delete Query Error:", err);
//                         return res.status(500).json({ message: "error", error: err });
//                     }

//                     console.log("Deleted data:", results);
//                 });
//             });
//         }

//         // ตรวจสอบว่ามีข้อมูลที่ต้องการเพิ่มหรือไม่
//         //ยังไม่ได้
//         if (insertData.length > 0) {
//             console.log("database inn", insertData)
//             console.log("indl id", indl_id)
//             // INSERT INTO Ingredient_lot_detail (ind_id, indl_id, qtypurchased, date_exp, price)
//             //                 VALUES (?, ?, ?, ?, ?)
//             const insertQuery = "INSERT INTO Ingredient_lot_detail (ind_id, qtypurchased, date_exp, price, indl_id) VALUES (?,?,?,?,?)";

//             const flattenedineData = insertData.flat();

//             flattenedineData.forEach(detail => {
//                 const insertValues = [
//                     detail.ind_id,
//                     detail.qtypurchased,
//                     detail.date_exp,
//                     detail.price,
//                     indl_id
//                 ];
//                 connection.query(insertQuery, insertValues, (err, results) => {
//                     if (err) {
//                         console.error("MySQL Insert Query Error:", err);
//                         return res.status(500).json({ message: "error", error: err });
//                     }

//                     console.log("Inserted data:", results);
//                 });
//             });


//         }

//         // ตรวจสอบว่ามีข้อมูลที่ต้องการอัปเดตหรือไม่

//         if (updateData.length > 0) {
//             console.log("database uppp", updateData)
//             const updateQuery = "UPDATE Ingredient_lot_detail SET qtypurchased = ?, date_exp = ?, price = ? WHERE ind_id = ? AND indl_id = ?";
//             //การใช้ flat() จะช่วยให้คุณได้ array ที่ flatten แล้วที่มี object ภายใน ซึ่งจะทำให้ง่ายต่อการทำงานกับข้อมูลในลำดับถัดไป.
//             const flattenedUpdateData = updateData.flat();

//             flattenedUpdateData.forEach(detail => {
//                 const updateValues = [
//                     detail.qtypurchased,
//                     detail.date_exp,
//                     detail.price,
//                     detail.ind_id,
//                     indl_id
//                 ];

//                 connection.query(updateQuery, updateValues, (err, results) => {
//                     if (err) {
//                         console.error("MySQL Update Query Error:", err);
//                         return res.status(500).json({ message: "error", error: err });
//                     }

//                     console.log("Updated data:", results);
//                 });
//             });

//         }

//         res.status(200).json({ message: "test เงื่อนไข" });

//     });
// });

//ลองแก้อันบนเป็น soft delete
//ได้ละเหลือแก้ตรงแสดงให้ไม่เลือกอันที่มี delete_at

//มาเพิ่มหักเข้า-ออก ใน lot เพิ่ม status และใส่เงื่อนไขใน in up
router.patch('/editData/:indl_id', isAdmin, (req, res, next) => {
    const indl_id = req.params.indl_id;
    // const dataToEdit = req.body.dataToEdit;
    const dataToEdit = req.body.dataaToEdit;
    const status = req.body


    if (!dataToEdit || dataToEdit.length === 0) {
        return res.status(400).json({ message: "error", error: "No data to edit provided" });
    }

    const query1 = 'UPDATE ingredient_lot SET status = ? WHERE indl_id = ?'
    connection.query(query1, [status, indl_id], (err, results) => {
        if (err) {
            console.error("MySQL Query Error:", err);
        }

        // แยกข้อมูลที่ต้องการอัปเดต แยกเป็นข้อมูลที่ต้องการเพิ่ม และข้อมูลที่ต้องการลบ
        const updateData = [];
        const insertData = [];
        const deleteData = [];
        const query = `SELECT ingredient_lot_detail.ind_id FROM ingredient_lot_detail WHERE indl_id = ?`;
        console.log(dataToEdit)

        let indIdsQ = dataToEdit.map(detail => detail.ind_id).filter(id => id !== undefined);
        console.log(indIdsQ);
        let indIds;

        connection.query(query, [indl_id], (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                // handle error
            }

            // ถ้าไม่มี error, results จะเป็น array ของ object ที่มี key เป็น 'ind_id'
            indIds = results.map(result => result.ind_id);
            // console.log("indIds:", indIds);

            indIds.forEach(detail => {
                //ยังอยู่ตรงนี้
                // console.log(detail)
                const selectedData = dataToEdit.filter(item => item.ind_id === detail);
                // const indIdsNotInIndIdsQdata = dataToEdit.filter(item => item.ind_id === indIdsNotInIndIdsQ);
                // console.log("for insert indIdsNotInIndIdsQdata",indIdsNotInIndIdsQdata)

                console.log("for up selectedData", selectedData)

                // console.log("for insert indIdsNotInIndIdsQ", indIdsNotInIndIdsQ)

                if (detail) {
                    // ตรวจสอบว่า ind_id มีอยู่ในฐานข้อมูลหรือไม่
                    // const query = `SELECT ingredient_lot_detail.ind_id FROM ingredient_lot_detail WHERE indl_id = ?`;

                    if (indIdsQ.includes(detail)) {
                        // ind_id มีอยู่ในฐานข้อมูล ให้ทำการอัปเดต
                        console.log("Update data:", selectedData);
                        updateData.push(selectedData);
                    } else {
                        if (indIds) {
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

            const indIdsNotInIndIdsQ = indIdsQ.filter(id => !indIds.includes(id));
            console.log(indIdsNotInIndIdsQ)

            if (indIdsNotInIndIdsQ != []) {
                indIdsNotInIndIdsQ.forEach(detail => {
                    console.log(detail)
                    const indIdsNotInIndIdsQdata = dataToEdit.filter(item => item.ind_id === detail);
                    console.log("Insert data:", indIdsNotInIndIdsQdata);
                    insertData.push(indIdsNotInIndIdsQdata);
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
                const deleteQuery = "UPDATE ingredient_lot_detail SET deleted_at = CURRENT_TIMESTAMP WHERE ind_id = ? AND indl_id = ?";
                deleteData.forEach(detail => {
                    const deleteValues = [detail, indl_id];
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
            //ยังไม่ได้
            if (insertData.length > 0) {
                console.log("database inn", insertData)
                console.log("indl id", indl_id)
                // INSERT INTO Ingredient_lot_detail (ind_id, indl_id, qtypurchased, date_exp, price)
                //                 VALUES (?, ?, ?, ?, ?)

                // const insertQuery = "INSERT INTO ingredient_lot_detail (ind_id, qtypurchased, date_exp, price, indl_id) VALUES (?,?,?,?,?)";

                // const flattenedineData = insertData.flat();

                // flattenedineData.forEach(detail => {
                //     const insertValues = [
                //         detail.ind_id,
                //         detail.qtypurchased,
                //         detail.date_exp,
                //         detail.price,
                //         indl_id
                //     ];
                const insertQuery = "INSERT INTO ingredient_lot_detail (ind_id, qtypurchased, date_exp, price, indl_id, deleted_at) VALUES (?,?,?,?,?,?)";

                const flattenedineData = insertData.flat();
                console.log("insertData", insertData)
                console.log("flattenedineData", flattenedineData)


                flattenedineData.forEach(detail => {
                    const insertValues = [
                        detail.ind_id,
                        detail.qtypurchased,
                        detail.date_exp,
                        detail.price,
                        indl_id,
                        null // กำหนดให้ deleted_at เป็น null
                    ];

                    connection.query(insertQuery, insertValues, (err, results) => {
                        if (err) {
                            console.error("MySQL Insert Query Error:", err);
                            return res.status(500).json({ message: "error", error: err });
                        }
                        if (status == "2" || 2) {
                            console.log("detail.ind_id", detail.ind_id)
                            const updateIngredientStockQuery = ` UPDATE ingredient SET ind_stock = ind_stock + ? WHERE ind_id = ?`;
                            flattenedineData.forEach(detail => {
                                connection.query(updateIngredientStockQuery, [detail.qtypurchased, detail.ind_id], (err, updateResults) => {
                                    if (err) {
                                        console.error("MySQL Error:", err);
                                    }
                                });
                            });
                        }
                    });


                    // if (dataToEdit.status === 2||"2") {
                    //     // const updateIngredientStock = true;
                    //     console.log("detail.ind_id", detail.ind_id)
                    //     const updateIngredientStockQuery = `UPDATE ingredient SET ind_stock = ind_stock + ? WHERE ind_id = ?`;
                    //     ingredient_lot_detail.forEach(detail => {
                    //         connection.query(updateIngredientStockQuery, [detail.qtypurchased, detail.ind_id], (err, results) => {
                    //             if (err) {
                    //                 console.error("MySQL Error:", err);
                    //             }
                    //         });
                    //     });
                    // }
                });


            }

            // ตรวจสอบว่ามีข้อมูลที่ต้องการอัปเดตหรือไม่
            // console.log("updateData",updateData)
            if (updateData.length > 0) {
                console.log("database uppp", updateData)
                // const updateQuery = "UPDATE Ingredient_lot_detail SET qtypurchased = ?, date_exp = ?, price = ? WHERE ind_id = ? AND indl_id = ?";
                const updateQuery = "UPDATE ingredient_lot_detail SET qtypurchased = ?, date_exp = ?, price = ?, deleted_at = NULL WHERE ind_id = ? AND indl_id = ?";
                //การใช้ flat() จะช่วยให้คุณได้ array ที่ flatten แล้วที่มี object ภายใน ซึ่งจะทำให้ง่ายต่อการทำงานกับข้อมูลในลำดับถัดไป.
                const flattenedUpdateData = updateData.flat();
                console.log("flattenedUpdateData", flattenedUpdateData)
                flattenedUpdateData.forEach(detail => {
                    const updateValues = [
                        detail.qtypurchased,
                        detail.date_exp,
                        detail.price,
                        detail.ind_id,
                        indl_id
                    ];

                    connection.query(updateQuery, updateValues, (err, results) => {
                        if (err) {
                            console.error("MySQL Update Query Error:", err);
                            return res.status(500).json({ message: "error", error: err });
                        }
                        if (status == "2" || 2) {
                            console.log("detail.ind_id", detail.ind_id)
                            const updateIngredientStockQuery = ` UPDATE ingredient SET ind_stock = ind_stock + ? WHERE ind_id = ?`;
                            flattenedUpdateData.forEach(resultDetail => {
                                connection.query(updateIngredientStockQuery, [resultDetail.qtypurchased, resultDetail.ind_id], (err, updateResults) => {
                                    if (err) {
                                        console.error("MySQL Error:", err);
                                    }
                                });
                            });

                        }

                        console.log("Updated data:", results);
                    });
                });

            }

            res.status(200).json({ message: "test เงื่อนไข" });

        });
    })
});

//ลองเช็ค exp ด้วย ไม่ได้
// router.patch('/editData/:indl_id', (req, res, next) => {
//     const indl_id = req.params.indl_id;
//     // const dataToEdit = req.body.dataToEdit;
//     const dataToEdit = req.body.dataaToEdit;
//     const status = req.body.status; // Corrected to req.body.status


//     if (!dataToEdit || dataToEdit.length === 0) {
//         return res.status(400).json({ message: "error", error: "No data to edit provided" });
//     }

//     const query1 = 'UPDATE ingredient_lot SET status = ? WHERE indl_id = ?'
//     connection.query(query1, [status, indl_id], (err, results) => {
//         if (err) {
//             console.error("MySQL Query Error:", err);
//             return res.status(500).json({ message: "error", error: err }); // Added error response
//         }

//         // แยกข้อมูลที่ต้องการอัปเดต แยกเป็นข้อมูลที่ต้องการเพิ่ม และข้อมูลที่ต้องการลบ
//         const updateData = [];
//         const insertData = [];
//         const deleteData = [];
//         const query = `SELECT ingredient_lot_detail.ind_id ,ingredient_lot_detail.date_exp FROM ingredient_lot_detail WHERE indl_id = ?`;

//         let indIdsQ = dataToEdit.map(detail => detail.ind_id).filter(id => id !== undefined);
//         let date_expQ = dataToEdit.map(detail => detail.date_exp).filter(date_exp => date_exp !== undefined);

//         connection.query(query, [indl_id], (err, results) => {
//             if (err) {
//                 console.error("MySQL Query Error:", err);
//                 return res.status(500).json({ message: "error", error: err }); // Added error response
//             }

//             let indIds = results.map(result => result.ind_id);
//             let date_exp = results.map(result => result.date_exp);

//             dataToEdit.forEach(detail => {
//                 // Convert detail.date_exp to the desired format
//                 const formattedDetailDate = new Date(detail.date_exp).toISOString().split('T')[0];

//                 console.log(formattedDetailDate, "detail.date_exp", detail.ind_id, "detail.ind_id");
//                 console.log(date_exp.map(date => new Date(date).toISOString().split('T')[0]), "date_exp", indIds, "indIds");
//                 console.log(indIds,"indIds")

//                 if (indIds.includes(detail.ind_id) && date_exp.map(date => new Date(date).toISOString().split('T')[0]).includes(formattedDetailDate)) {
//                     updateData.push(detail);
//                 } else {
//                     insertData.push(detail);
//                 }
//             });


//             const indIdsNotInIndIdsQ = indIdsQ.filter(id => !indIds.includes(id));

//             if (indIdsNotInIndIdsQ.length > 0) {
//                 indIdsNotInIndIdsQ.forEach(detail => {
//                     const indIdsNotInIndIdsQdata = dataToEdit.filter(item => item.ind_id === detail);
//                     insertData.push(indIdsNotInIndIdsQdata);
//                 });
//             }

//             if (deleteData.length > 0) {
//                 const deleteQuery = "UPDATE ingredient_lot_detail SET deleted_at = CURRENT_TIMESTAMP WHERE ind_id = ? AND indl_id = ?";
//                 deleteData.forEach(detail => {
//                     const deleteValues = [detail, indl_id];
//                     connection.query(deleteQuery, deleteValues, (err, results) => {
//                         if (err) {
//                             console.error("MySQL Delete Query Error:", err);
//                             return res.status(500).json({ message: "error", error: err }); // Added error response
//                         }
//                         console.log("Deleted data:", results);
//                     });
//                 });
//             }

//             if (insertData.length > 0) {
//                 const insertQuery = "INSERT INTO ingredient_lot_detail (ind_id, qtypurchased, date_exp, price, indl_id, deleted_at) VALUES (?,?,?,?,?,?)";
//                 const flattenedineData = insertData.flat();

//                 flattenedineData.forEach(detail => {
//                     const insertValues = [
//                         detail.ind_id,
//                         detail.qtypurchased,
//                         detail.date_exp,
//                         detail.price,
//                         indl_id,
//                         null // กำหนดให้ deleted_at เป็น null
//                     ];

//                     connection.query(insertQuery, insertValues, (err, results) => {
//                         if (err) {
//                             console.error("MySQL Insert Query Error:", err);
//                             return res.status(500).json({ message: "error", error: err }); // Added error response
//                         }
//                         if (status == "2" || status == 2) {
//                             const updateIngredientStockQuery = ` UPDATE ingredient SET ind_stock = ind_stock + ? WHERE ind_id = ?`;
//                             connection.query(updateIngredientStockQuery, [detail.qtypurchased, detail.ind_id], (err, updateResults) => {
//                                 if (err) {
//                                     console.error("MySQL Error:", err);
//                                 }
//                             });
//                         }
//                     });
//                 });
//             }

//             if (updateData.length > 0) {
//                 const updateQuery = "UPDATE ingredient_lot_detail SET qtypurchased = ?, date_exp = ?, price = ?, deleted_at = NULL WHERE ind_id = ? AND indl_id = ?";
//                 const flattenedUpdateData = updateData.flat();

//                 flattenedUpdateData.forEach(detail => {
//                     const updateValues = [
//                         detail.qtypurchased,
//                         detail.date_exp,
//                         detail.price,
//                         detail.ind_id,
//                         indl_id
//                     ];

//                     connection.query(updateQuery, updateValues, (err, results) => {
//                         if (err) {
//                             console.error("MySQL Update Query Error:", err);
//                             return res.status(500).json({ message: "error", error: err }); // Added error response
//                         }
//                         if (status == "2" || status == 2) {
//                             const updateIngredientStockQuery = ` UPDATE ingredient SET ind_stock = ind_stock + ? WHERE ind_id = ?`;
//                             connection.query(updateIngredientStockQuery, [detail.qtypurchased, detail.ind_id], (err, updateResults) => {
//                                 if (err) {
//                                     console.error("MySQL Error:", err);
//                                 }
//                             });
//                         }
//                         console.log("Updated data:", results);
//                     });
//                 });
//             }

//             res.status(200).json({ message: "success" });

//         });
//     })
// });





// ------------------------------------------วัตถุดิบใช้-----------------------------------------

// วัตถุดิบใช้ no production

//กลับมาดักกรณีไม่มีข้อมูล detail ห้ามเพิ่ม
// router.post('/addUseIngrediantnew', (req, res, next) => {
//     // const ingredient_lot = req.body;
//     // const ingredient_lot_detail = req.body;
//     const ingredient_Used = req.body.ingredient_Used;
//     const ingredient_Used_detail = req.body.ingredient_Used_detail;


//     const query = "INSERT INTO ingredient_Used (status,note) VALUES (?,?)";
//     connection.query(query, [ingredient_Used.status, ingredient_Used.note], (err, results) => {
//         if (!err) {
//             const indU_id = results.insertId;

//             const values = ingredient_Used_detail.map(detail => [
//                 indU_id,
//                 detail.ind_id,
//                 detail.qty_used_sum,
//                 detail.scrap,
//                 null // กำหนดให้ deleted_at เป็น null
//             ]);

//             const detailQuery = `
//                 INSERT INTO ingredient_Used_detail (indU_id, ind_id, qty_used_sum, scrap, deleted_at) 
//                 VALUES ?
//             `;

//             connection.query(detailQuery, [values], (err, results) => {
//                 if (err) {
//                     console.error("MySQL Error:", err);
//                     return res.status(500).json({ message: "error", error: err });
//                 } else {
//                     return res.status(200).json({ message: "success", indU_id, results });
//                 }
//             });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });
//ให้เลือกจาก exp
// router.post('/addUseIngrediantnew', (req, res, next) => {
//     const ingredient_Used = req.body.ingredient_Used;
//     const ingredient_Used_detail = req.body.ingredient_Used_detail;

//     const query = "INSERT INTO ingredient_Used (status, note) VALUES (?, ?)";
//     connection.query(query, [ingredient_Used.status, ingredient_Used.note], (err, results) => {
//         if (!err) {
//             const indU_id = results.insertId;

//             // Fetching indlde_id from ingredient_lot_detail based on ind_id and nearest date_exp
//             const promises = ingredient_Used_detail.map(detail => {
//                 return new Promise((resolve, reject) => {
//                     const selectQuery = `
//                         SELECT indlde_id,qty_stock
//                         FROM ingredient_lot_detail 
//                         WHERE ind_id = ? AND date_exp > NOW() 
//                         ORDER BY ABS(TIMESTAMPDIFF(SECOND, NOW(), date_exp)) 
//                         LIMIT 1
//                     `;
//                     connection.query(selectQuery, [detail.ind_id], (err, rows) => {
//                         if (err) {
//                             reject(err);
//                         } else {
//                             if (rows.length > 0) {
//                                 resolve(rows[0].indlde_id);
//                             } else {
//                                 reject("No matching record found for ind_id: " + detail.ind_id);
//                             }
//                         }
//                     });
//                 });
//             });

//             Promise.all(promises)
//                 .then(indlde_ids => {
//                     const values = ingredient_Used_detail.map((detail, index) => [
//                         indU_id,
//                         indlde_ids[index], // Use the fetched indlde_id
//                         detail.qty_used_sum,
//                         detail.scrap,
//                         null // Set deleted_at to null
//                     ]);

//                     const detailQuery = `
//                         INSERT INTO ingredient_Used_detail (indU_id, indlde_id , qty_used_sum, scrap, deleted_at) 
//                         VALUES ?
//                     `;

//                     connection.query(detailQuery, [values], (err, results) => {
//                         if (err) {
//                             console.error("MySQL Error:", err);
//                             return res.status(500).json({ message: "error", error: err });
//                         } else {
//                             return res.status(200).json({ message: "success", indU_id, results });
//                         }
//                     });
//                 })
//                 .catch(error => {
//                     console.error("MySQL Error:", error);
//                     return res.status(500).json({ message: "error", error: error });
//                 });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });
//เพิ่มเรื่องคำนวน ปริมาณแล้วหัก หมดละไม่หักใหม่
// router.post('/addUseIngrediantnew', (req, res, next) => {
//     const ingredient_Used = req.body.ingredient_Used;
//     const ingredient_Used_detail = req.body.ingredient_Used_detail;

//     const query = "INSERT INTO ingredient_Used (status, note) VALUES (?, ?)";
//     connection.query(query, [ingredient_Used.status, ingredient_Used.note], (err, results) => {
//         if (!err) {
//             const indU_id = results.insertId;

//             // Fetching indlde_id and calculating quantity used from ingredient_lot_detail based on ind_id and nearest date_exp
//             const promises = ingredient_Used_detail.map(detail => {
//                 return new Promise((resolve, reject) => {
//                     const selectQuery = `
//                     SELECT indlde_id, qty_stock, qty_per_unit
//                     FROM ingredient_lot_detail 
//                     JOIN ingredient ON ingredient_lot_detail.ind_id = ingredient.ind_id
//                     WHERE ingredient_lot_detail.ind_id = ? AND ingredient_lot_detail.date_exp > NOW() 
//                     ORDER BY 
//                         CASE 
//                             WHEN qty_stock > 0 THEN 0  -- สำหรับ indlde_id ที่มี qty_stock มากกว่าศูนย์ ให้เรียงลำดับแบบเดิม
//                             ELSE 1                      -- สำหรับ indlde_id ที่ qty_stock = 0 ให้เรียงลำดับไปยังด้านล่าง
//                         END,
//                         ABS(TIMESTAMPDIFF(SECOND, NOW(), ingredient_lot_detail.date_exp))
//                     LIMIT 1`;


//                     connection.query(selectQuery, [detail.ind_id], (err, rows) => {
//                         console.log(rows[0],rows[1])
//                         if (err) {
//                             reject(err);
//                         } else {
//                             if (rows.length > 0) {
//                                 const indlde_id = rows[0].indlde_id;
//                                 const qty_per_unit = rows[0].qty_per_unit;
//                                 const qty_used_sum = detail.qty_used_sum;
//                                 const scrap = detail.scrap;
//                                 const total_quantity_used = qty_used_sum * qty_per_unit + scrap;
//                                 const qty_stock = rows[0].qty_stock;

//                                 console.log(qty_stock,"qty_stock")
//                                 console.log(total_quantity_used,"total_quantity_used")

//                                 const new_qty_stock = qty_stock - total_quantity_used;
//                                 console.log(new_qty_stock,"new_qty_stock")

//                                 if (qty_stock < total_quantity_used) {

//                                     reject("Not enough stock for ind_id: " + detail.ind_id);
//                                 } else {
//                                     // Update qty_stock in ingredient_lot_detail
//                                     const updateStockQuery = `
//                                         UPDATE ingredient_lot_detail 
//                                         SET qty_stock = ? 
//                                         WHERE indlde_id = ?
//                                     `;
//                                     console.log(new_qty_stock)
//                                     console.log(total_quantity_used)

//                                     connection.query(updateStockQuery, [new_qty_stock, indlde_id], (err, updateResult) => {
//                                         if (err) {
//                                             reject(err);
//                                         } else {
//                                             resolve(indlde_id);
//                                         }
//                                     });
//                                 }
//                             } else {
//                                 reject("No matching record found for ind_id: " + detail.ind_id);
//                             }
//                         }
//                     });
//                 });
//             });

//             Promise.all(promises)
//                 .then(indlde_ids => {
//                     const values = ingredient_Used_detail.map((detail, index) => [
//                         indU_id,
//                         indlde_ids[index], // Use the fetched indlde_id
//                         detail.qty_used_sum,
//                         detail.scrap,
//                         null // Set deleted_at to null
//                     ]);

//                     const detailQuery = `
//                         INSERT INTO ingredient_Used_detail (indU_id, indlde_id , qty_used_sum, scrap, deleted_at) 
//                         VALUES ?
//                     `;

//                     connection.query(detailQuery, [values], (err, results) => {
//                         if (err) {
//                             console.error("MySQL Error:", err);
//                             return res.status(500).json({ message: "error", error: err });
//                         } else {
//                             return res.status(200).json({ message: "success", indU_id, results });
//                         }
//                     });
//                 })
//                 .catch(error => {
//                     console.error("MySQL Error:", error);
//                     return res.status(500).json({ message: "error", error: error });
//                 });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });
//ลองหมดละหักใหม่
// router.post('/addUseIngrediantnew', (req, res, next) => {
//     const ingredient_Used = req.body.ingredient_Used;
//     const ingredient_Used_detail = req.body.ingredient_Used_detail;

//     const query = "INSERT INTO ingredient_Used (status, note) VALUES (?, ?)";
//     connection.query(query, [ingredient_Used.status, ingredient_Used.note], (err, results) => {
//         if (!err) {
//             const indU_id = results.insertId;

//             // Fetching indlde_id and calculating quantity used from ingredient_lot_detail based on ind_id and nearest date_exp
//             const promises = ingredient_Used_detail.map(detail => {
//                 return new Promise((resolve, reject) => {
//                     const selectQuery = `
//                         SELECT indlde_id, qty_stock, qty_per_unit
//                         FROM ingredient_lot_detail 
//                         JOIN ingredient ON ingredient_lot_detail.ind_id = ingredient.ind_id
//                         WHERE ingredient_lot_detail.ind_id = ? AND ingredient_lot_detail.date_exp > NOW() 
//                         ORDER BY ABS(TIMESTAMPDIFF(SECOND, NOW(), ingredient_lot_detail.date_exp)) 
//                         LIMIT 1
//                     `;
//                     connection.query(selectQuery, [detail.ind_id], (err, rows) => {
//                         if (err) {
//                             reject(err);
//                         } else {
//                             if (rows.length > 0) {
//                                 const indlde_id = rows[0].indlde_id;
//                                 const qty_per_unit = rows[0].qty_per_unit;
//                                 const qty_used_sum = detail.qty_used_sum;
//                                 const scrap = detail.scrap;
//                                 const total_quantity_used = qty_used_sum * qty_per_unit + scrap;
//                                 const qty_stock = rows[0].qty_stock;

//                                 console.log(qty_stock,"qty_stock")
//                                 console.log(total_quantity_used,"total_quantity_used")

//                                 const new_qty_stock = qty_stock - total_quantity_used;
//                                 console.log(new_qty_stock,"new_qty_stock")

//                                 if (qty_stock < total_quantity_used) {
//                                     reject("Not enough stock for ind_id: " + detail.ind_id);
//                                 } else {
//                                     // Update qty_stock in ingredient_lot_detail
//                                     const updateStockQuery = `
//                                         UPDATE ingredient_lot_detail 
//                                         SET qty_stock = ? 
//                                         WHERE indlde_id = ?
//                                     `;

//                                     connection.query(updateStockQuery, [new_qty_stock, indlde_id], (err, updateResult) => {
//                                         if (err) {
//                                             reject(err);
//                                         } else {
//                                             // Add the quantity used sum to the detail object
//                                             detail.qty_used_sum = total_quantity_used;

//                                             resolve(indlde_id);
//                                         }
//                                     });
//                                 }
//                             } else {
//                                 reject("No matching record found for ind_id: " + detail.ind_id);
//                             }
//                         }
//                     });
//                 });
//             });

//             Promise.all(promises)
//                 .then(indlde_ids => {
//                     const values = ingredient_Used_detail.map((detail, index) => [
//                         indU_id,
//                         indlde_ids[index], // Use the fetched indlde_id
//                         detail.qty_used_sum, // Use the updated qty_used_sum
//                         detail.scrap,
//                         null // Set deleted_at to null
//                     ]);

//                     const detailQuery = `
//                         INSERT INTO ingredient_Used_detail (indU_id, indlde_id , qty_used_sum, scrap, deleted_at) 
//                         VALUES ?
//                     `;

//                     connection.query(detailQuery, [values], (err, results) => {
//                         if (err) {
//                             console.error("MySQL Error:", err);
//                             return res.status(500).json({ message: "error", error: err });
//                         } else {
//                             return res.status(200).json({ message: "success", indU_id, results });
//                         }
//                     });
//                 })
//                 .catch(error => {
//                     console.error("MySQL Error:", error);
//                     return res.status(500).json({ message: "error", error: error });
//                 });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });




// ลองเอง
// 15-05-24 ลองเทสใหม่ว่าลืมเก็บลงDBมั้ย กรณี แป้งสาลีใช้ 2 lot
// 15-05-24 และลองคิดกรณีทำซ้อนหลายอันแล้ววไม่กดยืนยันการใช้ หรือ แบบทำพร้อมกัน (จดว้ในกู้ดโน้ต)
//16-05-24 ได้ สถานะ 1 2 ก็หักใน lotde เหลือใน ind_stock
//17-05-24 เหมือนมีส่วนคำนวณผิด มีค่า - ในตาราง indlotde ถูกอัปเดต
//30-06 ลองลบตารางเทสใหม่ status =1 หัก 3 ล็อตเหมือนจะถูก
//หรือเปลี่ยนเป็นapiใช้คำนวณเก็บล็อตไหนๆ แต่เวลาหักใช้ fuction
//30-06 เหมือนจะคำนวณถูกแล้วลองกรณีใช้ 4 ล็อต ทำแบบเดิมเพราะเผื่อคำนวณต้นทุน 
//เพิ่มวัตถุดิบที่ใช้อื่นๆ
// router.post('/addUseIngrediantnew', (req, res, next) => {
//     const ingredient_Used = req.body.ingredient_Used;
//     const ingredient_Used_detail = req.body.ingredient_Used_detail;

//     const query = "INSERT INTO ingredient_Used (status, note) VALUES (?, ?)";
//     connection.query(query, [ingredient_Used.status, ingredient_Used.note], (err, results) => {
//         if (!err) {
//             const indU_id = results.insertId;
//             ingredient_Used_detail.forEach((detail, index) => {
//                 // const ind_id = detail.ind_id;
//                 // const qty_used_sum = detail.qty_used_sum;
//                 // const scrap = detail.scrap;

//                 const query = `
//                      SELECT indlde_id, qty_stock, qty_per_unit
//                      FROM ingredient
//                      JOIN ingredient_lot_detail ON ingredient_lot_detail.ind_id = ingredient.ind_id
//                      JOIN ingredient_lot ON ingredient_lot.indl_id = ingredient_lot_detail.indl_id
//                      WHERE ingredient_lot_detail.ind_id = ? AND ingredient_lot_detail.date_exp > NOW() and qty_stock > 0 and ingredient_lot.status="2"
//                      ORDER BY ingredient_lot_detail.date_exp ASC;`;

//                 connection.query(query, [detail.ind_id], (err, results) => {
//                     if (err) {
//                         console.error("MySQL Query Error:", err);
//                         // handle error
//                     }
//                     let indlde_id = [];
//                     const detailall = [];
//                     const upind = []

//                     // วน loop ผ่านทุกๆ แถวของผลลัพธ์
//                     let stopLoop = false; // สร้างตัวแปรเพื่อสำหรับบอกว่าควรหยุดลูปหรือไม่
//                     let new_qty_stock = 1; // สร้างตัวแปร new_qty_stock เพื่อให้สามารถเข้าถึงได้จากทั้งสองลูป
//                     //เช็คเงื่อนไขดีๆ อาจจะะให้เปลี่ยนไปมา stopLoop = false;
//                     results.forEach(result => {
//                         if (!stopLoop) { // ตรวจสอบว่ายังไม่ควรหยุดลูป

//                             //เปลี่ยนมาใช้ลูป ด้านล่าง อันนี้เหมือนทำได้แบบผิดพลาดแปลกๆ
//                             if (new_qty_stock > 0) {
//                                 const qty_per_unit = result.qty_per_unit;
//                                 const qty_used_sum = detail.qty_used_sum;
//                                 const scrap = detail.scrap;
//                                 const total_quantity_used = qty_used_sum * qty_per_unit + scrap; // ทำให้ qty_stock เป็นค่าบวก
//                                 const qty_stock = result.qty_stock;

//                                 console.log(total_quantity_used, "total_quantity_used > 0 ---1",);
//                                 console.log(qty_stock, "qty_stock > 0 ---1");

//                                 new_qty_stock = qty_stock - total_quantity_used;
//                                 console.log(new_qty_stock, "new_qty_stock > 0 ---1");

//                                 if (new_qty_stock < 0) {
//                                     const new_qty_stockup = total_quantity_used + new_qty_stock

//                                     const itemIn = {
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
//                                     detailall.push(itemIn);

//                                     if (ingredient_Used.status == "2") {

//                                         const itemUp = {
//                                             indlde_id: result.indlde_id,
//                                             qty_stock: 0 // ใช้ค่าจากการ query
//                                         };
//                                         upind.push(itemUp);
//                                     }
//                                 } else {
//                                     const itemIn = {
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: total_quantity_used, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     detailall.push(itemIn);

//                                     if (ingredient_Used.status == "2") {

//                                         const itemUp = {
//                                             indlde_id: result.indlde_id,
//                                             qty_stock: new_qty_stock, // ใช้ค่าจากการ query

//                                         };
//                                         upind.push(itemUp);
//                                     }
//                                     stopLoop = true;

//                                 }

//                             }

//                             // ตรวจสอบว่า new_qty_stock เป็น 0 หรือไม่ ถ้าเป็นให้หยุดลูป
//                             //
//                             else if (new_qty_stock < 0) {
//                                 console.log(new_qty_stock, "new_qty_stock<0 ---2")
//                                 console.log(result.qty_stock, "result.qty_stock<0 ---2")
//                                 //ก็อบมาเพื่อใช้กรณรี == 0
//                                 let new_qty_stockup = new_qty_stock
//                                 // newqtystockforup = result.qty_stock + new_qty_stock;
//                                 new_qty_stock = result.qty_stock + new_qty_stock;
//                                 // new_qty_stock = Math.abs(new_qty_stock);
//                                 // ถ้าค่า>=0
//                                 if (new_qty_stock > 0) {

//                                     console.log(new_qty_stockup, "new_qty_stock > 0 ---2")
//                                     new_qty_stockup = Math.abs(new_qty_stockup);
//                                     const itemIn = {
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     detailall.push(itemIn);

//                                     if (ingredient_Used.status == "2") {

//                                         const itemUp = {
//                                             indlde_id: result.indlde_id,
//                                             qty_stock: new_qty_stock, // ใช้ค่าจากการ query

//                                         };
//                                         upind.push(itemUp);
//                                     }

//                                     stopLoop = true;

//                                     // }else if (newqtystockforup < 0){
//                                     // ถ้าค่าน้อยกว่า 0
//                                 } else if (new_qty_stock == 0) {
//                                     console.log(new_qty_stockup, "new_qty_stockupM == 0 ---2")
//                                     new_qty_stockup = Math.abs(new_qty_stockup);

//                                     const itemIn = {
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     detailall.push(itemIn);

//                                     if (ingredient_Used.status == "2") {

//                                         const itemUp = {
//                                             indlde_id: result.indlde_id,
//                                             qty_stock: new_qty_stock, // ใช้ค่าจากการ query

//                                         };
//                                         upind.push(itemUp);
//                                     }

//                                     stopLoop = true;

//                                 } else {
//                                     console.log(new_qty_stock, "new_qty_stock < 0 วนใหม่")

//                                     new_qty_stockup = Math.abs(new_qty_stock);

//                                     const itemIn = {
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: result.qty_stock, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     detailall.push(itemIn);

//                                     stopLoop = false;
//                                 }



//                             } else {
//                                 stopLoop = true;
//                             }

//                         }
//                     });

//                     console.log(detailall, "detailall")
//                     console.log(upind, "upind")
//                     //เหลือใส่ DB
//                     if (detailall.length > 0) {
//                         const insertDetailQuery = "INSERT INTO ingredient_Used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
//                         const detailValues = detailall.map(item => [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at]);

//                         connection.query(insertDetailQuery, [detailValues], (err, result) => {
//                             if (err) {
//                                 console.error("Error inserting detail data:", err);
//                                 // Handle error
//                             } else {
//                                 console.log("Detail data inserted successfully");
//                                 // Proceed with other operations or respond to the client
//                             }
//                         });

//                     }
//                     if (ingredient_Used.status == "2" || 2) {

//                         if (upind.length > 0) {

//                             const updateQuery = " UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";
//                             // const detailValues = upind.map(item => [item.qty_stock, item.indlde_id]);
//                             // const flattenedUpdateData = upind.flat();

//                             upind.forEach(item => {
//                                 const updateValues = [item.qty_stock, item.indlde_id]


//                                 connection.query(updateQuery, updateValues, (err, results) => {
//                                     if (err) {
//                                         console.error("MySQL Update Query Error:", err);
//                                         return res.status(500).json({ message: "error", error: err });
//                                     }

//                                     console.log("Updated data:", results);
//                                 });
//                             });

//                         }
//                     }

//                 })

//             });

//             if (!err) {
//                 res.status(200).json({ message: "success" });
//                 const { checkMinimumIngredient } = require('../routes/notification');
//             checkMinimumIngredient(io);
//             }




//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });
// });
// //เพิ่มวัตถุดิบที่ใช้อื่นๆ ลองปรับเพื่อการแจ้งเตือน ใช้ asynchronous
router.post('/addUseIngrediantnew', async (req, res, next) => {
    const ingredient_Used = req.body.ingredient_Used;
    const ingredient_Used_detail = req.body.ingredient_Used_detail;

    try {
        // แทรกข้อมูลลงในตาราง ingredient_Used
        const query = "INSERT INTO ingredient_used (status, note) VALUES (?, ?)";
        const [results] = await connection.promise().query(query, [ingredient_Used.status, ingredient_Used.note]);
        const indU_id = results.insertId;

        const detailall = [];
        const upind = [];

        // วนลูปผ่าน ingredient_Used_detail
        for (const detail of ingredient_Used_detail) {
            const query = `
                SELECT indlde_id, qty_stock, qty_per_unit
                FROM ingredient
                JOIN ingredient_lot_detail ON ingredient_lot_detail.ind_id = ingredient.ind_id
                JOIN ingredient_lot ON ingredient_lot.indl_id = ingredient_lot_detail.indl_id
                WHERE ingredient_lot_detail.ind_id = ? 
                AND ingredient_lot_detail.date_exp > NOW() 
                AND qty_stock > 0 
                AND ingredient_lot.status = "2"
                ORDER BY ingredient_lot_detail.date_exp ASC
            `;

            const [results] = await connection.promise().query(query, [detail.ind_id]);

            let stopLoop = false;
            let new_qty_stock = 1;

            // วนลูปผ่านผลลัพธ์จาก query
            for (const result of results) {
                if (!stopLoop) {
                    if (new_qty_stock > 0) {
                        const qty_per_unit = result.qty_per_unit;
                        const qty_used_sum = detail.qty_used_sum;
                        const scrap = detail.scrap;
                        const total_quantity_used = qty_used_sum * qty_per_unit + scrap;
                        const qty_stock = result.qty_stock;

                        new_qty_stock = qty_stock - total_quantity_used;

                        if (new_qty_stock < 0) {
                            const new_qty_stockup = total_quantity_used + new_qty_stock;

                            detailall.push({
                                indU_id: indU_id,
                                indlde_id: result.indlde_id,
                                qty_used_sum: detail.qty_used_sum,
                                scrap: detail.scrap,
                                qtyusesum: new_qty_stockup,
                                deleted_at: null
                            });

                            if (ingredient_Used.status == "2") {
                                upind.push({ indlde_id: result.indlde_id, qty_stock: 0 });
                            }
                        } else {
                            detailall.push({
                                indU_id: indU_id,
                                indlde_id: result.indlde_id,
                                qty_used_sum: detail.qty_used_sum,
                                scrap: detail.scrap,
                                qtyusesum: total_quantity_used,
                                deleted_at: null
                            });

                            if (ingredient_Used.status == "2") {
                                upind.push({ indlde_id: result.indlde_id, qty_stock: new_qty_stock });
                            }

                            stopLoop = true;
                        }
                    } else if (new_qty_stock < 0) {
                        let new_qty_stockup = new_qty_stock;

                        new_qty_stock = result.qty_stock + new_qty_stock;
                        new_qty_stockup = Math.abs(new_qty_stockup);

                        if (new_qty_stock > 0 || new_qty_stock == 0) {
                            detailall.push({
                                indU_id: indU_id,
                                indlde_id: result.indlde_id,
                                qty_used_sum: detail.qty_used_sum,
                                scrap: detail.scrap,
                                qtyusesum: new_qty_stockup,
                                deleted_at: null
                            });

                            if (ingredient_Used.status == "2") {
                                upind.push({ indlde_id: result.indlde_id, qty_stock: new_qty_stock });
                            }

                            stopLoop = true;
                        } else {
                            detailall.push({
                                indU_id: indU_id,
                                indlde_id: result.indlde_id,
                                qty_used_sum: detail.qty_used_sum,
                                scrap: detail.scrap,
                                qtyusesum: result.qty_stock,
                                deleted_at: null
                            });
                        }
                    } else {
                        stopLoop = true;
                    }
                }
            }
        }

        // แทรกรายละเอียด detailall ลงในฐานข้อมูล
        if (detailall.length > 0) {
            const insertDetailQuery = "INSERT INTO ingredient_Used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
            const detailValues = detailall.map(item => [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at]);

            await connection.promise().query(insertDetailQuery, [detailValues]);
            console.log("แทรกข้อมูลรายละเอียดสำเร็จ");
        }

        // อัปเดต ingredient_lot_detail หากสถานะ == "2"
        if (ingredient_Used.status == "2" && upind.length > 0) {
            const updateQuery = "UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";

            for (const item of upind) {
                await connection.promise().query(updateQuery, [item.qty_stock, item.indlde_id]);
            }

            console.log("อัปเดตรายละเอียด lot สำเร็จ");
        }

        // เรียกใช้ฟังก์ชัน Updateqtystock ก่อน checkAndAddNotifications
        console.log("Updateqtystock ใน api used");
        Updateqtystock(); // เรียกใช้ฟังก์ชันที่ต้องการ

        // ส่งการตอบกลับสำเร็จ
        res.status(200).json({ message: "success" });

        // เรียกฟังก์ชันแจ้งเตือน
        const { checkAndAddNotifications } = require('../routes/notification');

        const io = req.app.locals.io;
        // ในไฟล์ ingredient.js
        checkAndAddNotifications(io);

        // console.log('io',io)

    } catch (err) {
        console.error("ข้อผิดพลาด MySQL:", err);
        return res.status(500).json({ message: "error", error: err });
    }
});

//เพิ่มวัตถุดิบที่ใช้ตาม ล็อตผลิต
//กำลังคิดว่ายังไม่เพิ่มลง DB ส่งแบบ json ไปให้ แล้วจะสามารถแก้ไขข้อมูล json นั้นผ่านหน้าเว็บได้มั้ย แล้วเพิ่มลง DB เมื่อกดยืนยัน โดยเอาจาก json ที่ส่งไป แต่ตัวที่ไม่โชว์จะทำได้มั้ย
// router.post('/addUseIngrediantLotpro', (req, res, next) => {
//     const pdo_id = req.body.pdo_id;

//     // ตามหาจำนวนวัตถุดิบที่ใช้ก่อน
//     const query = `
//     SELECT 
//         pdo.pdo_id, 
//         pdod.*, 
//         pd.*, 
//         rc.*, 
//         rcd.*, 
//         ind.*
//     FROM 
//         productionOrder as pdo
//     JOIN 
//         productionOrderdetail as pdod ON pdod.pdo_id = pdo.pdo_id
//     JOIN 
//         products as pd ON pd.pd_id = pdod.pd_id
//     JOIN 
//         recipe as rc ON rc.pd_id = pd.pd_id
//     JOIN 
//         recipedetail as rcd ON rcd.rc_id = rc.rc_id
//     JOIN 
//         ingredient as ind ON rcd.ind_id = ind.ind_id
//     WHERE 
//         pdo.pdo_id = ?;`;

//     connection.query(query, pdo_id, (err, results) => {
//         if (err) {
//             console.error("MySQL Query Error:", err);
//             return;
//         }

//         const groupedResults = results.reduce((acc, row) => {
//             if (!acc[row.pdod_id]) {
//                 acc[row.pdod_id] = [];
//             }
//             acc[row.pdod_id].push(row);
//             return acc;
//         }, {});

//         const finalResults = [];

//         Object.entries(groupedResults).forEach(([pdod_id, rows]) => {
//             rows.forEach(row => {
//                 const Qx = row.ingredients_qty;
//                 const N = row.qty;
//                 const M = row.produced_qty;
//                 const qty_per_unit = row.qty_per_unit;

//                 const Qx_prime = (Qx * N) / M;
//                 const qty_used_sum = Math.floor(Qx_prime / qty_per_unit);
//                 const scrap = Qx_prime % qty_per_unit;

//                 finalResults.push({
//                     pdod_id: parseInt(pdod_id, 10),
//                     ind_id: row.ind_id,
//                     qty_used_sum: qty_used_sum,
//                     scrap: scrap
//                 });
//             });
//         });

//         console.log(finalResults);



//         res.status(200).json({ finalResults: finalResults });
//     });




// });

// ui อาจต้องเปลี่ยน ส่งไปโชว์ที่คำนวณ
router.get('/addUseIngrediantLotpro/:pdo_id', (req, res, next) => {
    const pdo_id = req.params.pdo_id;
    // ตามหาจำนวนวัตถุดิบที่ใช้ก่อน
    const query = `
    SELECT 
        pdo.pdo_id, 
        pdod.*, 
        pd.*, 
        rc.*, 
        rcd.*, 
        ind.*
    FROM 
        productionOrder as pdo
    JOIN 
        productionOrderdetail as pdod ON pdod.pdo_id = pdo.pdo_id
    JOIN 
        products as pd ON pd.pd_id = pdod.pd_id
    JOIN 
        recipe as rc ON rc.pd_id = pd.pd_id
    JOIN 
        recipedetail as rcd ON rcd.rc_id = rc.rc_id
    JOIN 
        ingredient as ind ON rcd.ind_id = ind.ind_id
    WHERE 
        pdo.pdo_id = ?;`;

    connection.query(query, pdo_id, (err, results) => {
        if (err) {
            console.error("MySQL Query Error:", err);
            return;
        }

        const groupedResults = results.reduce((acc, row) => {
            if (!acc[row.pdod_id]) {
                acc[row.pdod_id] = [];
            }
            acc[row.pdod_id].push(row);
            return acc;
        }, {});

        const finalResults = [];

        Object.entries(groupedResults).forEach(([pdod_id, rows]) => {
            rows.forEach(row => {
                const Qx = row.ingredients_qty;
                const N = row.qty;
                const M = row.produced_qty;
                const qty_per_unit = row.qty_per_unit;

                const Qx_prime = (Qx * N) / M;
                const qty_used_sum = Math.floor(Qx_prime / qty_per_unit);
                const scrap = Qx_prime % qty_per_unit;

                finalResults.push({
                    pd_name: row.pd_name,
                    pdod_id: parseInt(pdod_id, 10),
                    ind_name: row.ind_name,
                    ind_id: row.ind_id,
                    qty_used_sum: qty_used_sum,
                    scrap: scrap
                });
            });
        });

        console.log(finalResults);



        res.status(200).json({ finalResults: finalResults });
    });




});
//แก้ไขรายละเอียดวัตถุดิบที่ใช้ตามล็อต เปลี่ยนไปแก้ไขตรง ui แล้วส่งมาเพิ่มทีเดียว
//เพิ่มตามล้อต
//เพิ่มได้แล้วยังไม่เช็คคำนวณ
router.post('/addUseIngrediantLot', (req, res, next) => {
    const ingredient_Used_Lot = req.body.ingredient_Used_Lot;
    const pdo_id = req.body.pdo_id;
    ingredient_Used_Lot.forEach((detail, index) => {
        // const ind_id = detail.ind_id;
        // const qty_used_sum = detail.qty_used_sum;
        // const scrap = detail.scrap;

        const query = `
                     SELECT indlde_id, qty_stock, qty_per_unit
                     FROM ingredient
                     JOIN ingredient_lot_detail ON ingredient_lot_detail.ind_id = ingredient.ind_id
                     JOIN ingredient_lot ON ingredient_lot.indl_id = ingredient_lot_detail.indl_id
                     WHERE ingredient_lot_detail.ind_id = ? AND ingredient_lot_detail.date_exp > NOW() and qty_stock > 0 and ingredient_lot.status="2"
                     ORDER BY ingredient_lot_detail.date_exp ASC;`;

        connection.query(query, [detail.ind_id], (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                // handle error
            }
            let indlde_id = [];
            const detailall = [];
            const upind = []
            // const InduP = results.insertId;

            // วน loop ผ่านทุกๆ แถวของผลลัพธ์
            let stopLoop = false; // สร้างตัวแปรเพื่อสำหรับบอกว่าควรหยุดลูปหรือไม่
            let new_qty_stock = 1; // สร้างตัวแปร new_qty_stock เพื่อให้สามารถเข้าถึงได้จากทั้งสองลูป
            //เช็คเงื่อนไขดีๆ อาจจะะให้เปลี่ยนไปมา stopLoop = false;
            results.forEach(result => {
                if (!stopLoop) { // ตรวจสอบว่ายังไม่ควรหยุดลูป

                    //เปลี่ยนมาใช้ลูป ด้านล่าง อันนี้เหมือนทำได้แบบผิดพลาดแปลกๆ
                    if (new_qty_stock > 0) {
                        const qty_per_unit = result.qty_per_unit;
                        const qty_used_sum = detail.qty_used_sum;
                        const scrap = detail.scrap;
                        const total_quantity_used = qty_used_sum * qty_per_unit + scrap; // ทำให้ qty_stock เป็นค่าบวก
                        const qty_stock = result.qty_stock;

                        console.log(total_quantity_used, "total_quantity_used > 0 ---1",);
                        console.log(qty_stock, "qty_stock > 0 ---1");

                        new_qty_stock = qty_stock - total_quantity_used;
                        console.log(new_qty_stock, "new_qty_stock > 0 ---1");

                        if (new_qty_stock < 0) {
                            const new_qty_stockup = total_quantity_used + new_qty_stock

                            const itemIn = {
                                // induP: InduP, // ใช้ค่าจากตัวแปรนอกลูป
                                indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                pdod_id: detail.pdod_id,
                                qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
                                status: 2,
                                deleted_at: null // ใช้ค่าที่คำนวณได้
                            };
                            // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
                            detailall.push(itemIn);



                            const itemUp = {
                                indlde_id: result.indlde_id,
                                qty_stock: 0 // ใช้ค่าจากการ query
                            };
                            upind.push(itemUp);

                        } else {
                            const itemIn = {
                                // induP: InduP, // ใช้ค่าจากตัวแปรนอกลูป
                                indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                pdod_id: detail.pdod_id,
                                qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                qtyusesum: total_quantity_used, // ใช้ค่าที่คำนวณได้
                                status: 2,
                                deleted_at: null // ใช้ค่าที่คำนวณได้
                            };
                            detailall.push(itemIn);


                            const itemUp = {
                                indlde_id: result.indlde_id,
                                qty_stock: new_qty_stock, // ใช้ค่าจากการ query

                            };
                            upind.push(itemUp);

                            stopLoop = true;

                        }

                    }

                    // ตรวจสอบว่า new_qty_stock เป็น 0 หรือไม่ ถ้าเป็นให้หยุดลูป
                    //
                    else if (new_qty_stock < 0) {
                        console.log(new_qty_stock, "new_qty_stock<0 ---2")
                        console.log(result.qty_stock, "result.qty_stock<0 ---2")
                        //ก็อบมาเพื่อใช้กรณรี == 0
                        let new_qty_stockup = new_qty_stock
                        // newqtystockforup = result.qty_stock + new_qty_stock;
                        new_qty_stock = result.qty_stock + new_qty_stock;
                        // new_qty_stock = Math.abs(new_qty_stock);
                        // ถ้าค่า>=0
                        if (new_qty_stock > 0) {

                            console.log(new_qty_stockup, "new_qty_stock > 0 ---2")
                            new_qty_stockup = Math.abs(new_qty_stockup);
                            const itemIn = {
                                // induP: InduP, // ใช้ค่าจากตัวแปรนอกลูป
                                indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                pdod_id: detail.pdod_id,
                                qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
                                status: 2,
                                deleted_at: null // ใช้ค่าที่คำนวณได้
                            };
                            detailall.push(itemIn);



                            const itemUp = {
                                indlde_id: result.indlde_id,
                                qty_stock: new_qty_stock, // ใช้ค่าจากการ query

                            };
                            upind.push(itemUp);


                            stopLoop = true;

                            // }else if (newqtystockforup < 0){
                            // ถ้าค่าน้อยกว่า 0
                        } else if (new_qty_stock == 0) {
                            console.log(new_qty_stockup, "new_qty_stockupM == 0 ---2")
                            new_qty_stockup = Math.abs(new_qty_stockup);

                            const itemIn = {
                                // induP: InduP, // ใช้ค่าจากตัวแปรนอกลูป
                                indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                pdod_id: detail.pdod_id,
                                qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
                                status: 2,
                                deleted_at: null // ใช้ค่าที่คำนวณได้
                            };
                            detailall.push(itemIn);


                            const itemUp = {
                                indlde_id: result.indlde_id,
                                qty_stock: new_qty_stock, // ใช้ค่าจากการ query

                            };
                            upind.push(itemUp);


                            stopLoop = true;

                        } else {
                            console.log(new_qty_stock, "new_qty_stock < 0 วนใหม่")

                            new_qty_stockup = Math.abs(new_qty_stock);

                            const itemIn = {
                                // induP: InduP, // ใช้ค่าจากตัวแปรนอกลูป
                                indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                pdod_id: detail.pdod_id,
                                qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                qtyusesum: result.qty_stock, // ใช้ค่าที่คำนวณได้
                                status: 2,
                                deleted_at: null // ใช้ค่าที่คำนวณได้
                            };
                            detailall.push(itemIn);

                            stopLoop = false;
                        }



                    } else {
                        stopLoop = true;
                    }

                }
            });

            console.log(detailall, "detailall")
            console.log(upind, "upind")
            //เหลือใส่ DB
            //แก้migreatตรงqtyusesum
            if (detailall.length > 0) {
                const insertDetailQuery = "INSERT INTO ingredient_Used_Pro ( indlde_id, pdod_id, qty_used_sum, scrap, qtyusesum,status, deleted_at) VALUES ?";
                const detailValues = detailall.map(item => [item.indlde_id, item.pdod_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.status, item.deleted_at]);

                connection.query(insertDetailQuery, [detailValues], (err, result) => {
                    if (err) {
                        console.error("Error inserting detail data:", err);
                        // Handle error
                    } else {
                        console.log("Detail data inserted successfully");
                        // Proceed with other operations or respond to the client
                    }
                });

            }


            if (upind.length > 0) {

                const updateQuery = " UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";
                // const detailValues = upind.map(item => [item.qty_stock, item.indlde_id]);
                // const flattenedUpdateData = upind.flat();

                const updatestatusQuery = " UPDATE productionOrder SET pdo_status = 4 WHERE pdo_id = ?";


                upind.forEach(item => {
                    const updateValues = [item.qty_stock, item.indlde_id]


                    connection.query(updateQuery, updateValues, (err, results) => {
                        if (err) {
                            console.error("MySQL Update Query Error:", err);
                            return res.status(500).json({ message: "error", error: err });
                        }

                        console.log("Updated data:", results);
                    });
                });

                connection.query(updatestatusQuery, pdo_id, (err, results) => {
                    if (err) {
                        console.error("MySQL Update Query Error:", err);
                        return res.status(500).json({ message: "error", error: err });
                    }

                    console.log("Updated pdo_id data:", results);
                });



            }


        })

    });
    // if (!err) {
    res.status(200).json({ message: "success" });
    // }

})

router.get('/readdetailLotpro/:pdo_id', (req, res, next) => {
    const pdo_id = req.params.pdo_id;

    const query = `
    SELECT 
        pdo.pdo_id, 
        iup.*, 
        iud.*, 
        pdod.*, 
        ind.*
    FROM 
        ingredient_Used_Pro as iup
    JOIN 
        ingredient_Used_detail as iud ON iup.indlde_id = iud.indlde_id
    JOIN 
        productionOrderdetail as pdod ON iup.pdod_id = pdod.pdod_id	
    JOIN 
        productionOrder as pdo ON pdo.pdo_id = pdod.pdo_id	
    JOIN 
        ingredient as ind ON ind.ind_id = iud.ind_id	
    WHERE 
        pdo.pdo_id = ?;
    `;

    connection.query(query, [pdo_id], (err, results) => {
        if (err) {
            console.error("MySQL Query Error:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        // Group results by pdo_id
        const groupedResults = results.reduce((acc, item) => {
            if (!acc[item.pdo_id]) {
                acc[item.pdo_id] = {
                    pdo_id: item.pdo_id,
                    productionOrderdetails: [],
                };
            }

            const existingPdod = acc[item.pdo_id].productionOrderdetails.find(pdod => pdod.pdod_id === item.pdod_id);

            if (existingPdod) {
                // Add ingredient_Used_Pro to existing productionOrderdetail
                existingPdod.ingredient_Used_Pro.push({
                    qty_used_sum: item.qty_used_sum,
                    scrap: item.scrap,
                    qtyusesum: item.qtyusesum,
                    ind_id: item.ind_id,
                    ind_name: item.ind_name,
                    qty: item.qty
                });
            } else {
                // Create a new productionOrderdetail entry
                acc[item.pdo_id].productionOrderdetails.push({
                    pdod_id: item.pdod_id,
                    pdod_qty: item.pdod_qty,
                    ingredient_Used_Pro: [{
                        qty_used_sum: item.qty_used_sum,
                        scrap: item.scrap,
                        qtyusesum: item.qtyusesum,
                        ind_id: item.ind_id,
                        ind_name: item.ind_name,
                        qty: item.qty
                    }]
                });
            }

            return acc;
        }, {});

        // Convert the groupedResults object to an array
        const formattedResults = Object.values(groupedResults);

        return res.status(200).json(formattedResults);
    });
});
//all วัตถุดิบที่ใช้
// router.get('/usedIngredients', (req, res, next) => {
//     const query = `
//     SELECT * FROM (
//         SELECT 
//             indU.indU_id AS id,
//             indU.status,
//             indU.note,
//             indU.created_at,
//             indU.updated_at,
//             'ทั่วไป' AS name,
//             'other' AS checkk
//         FROM 
//             ingredient_Used AS indU
//         WHERE 
//             indU.status != 0
        
//         UNION ALL
        
//         SELECT 
//             CONCAT('PD', LPAD(induP.pdod_id, 7, '0')) AS id,
//             induP.status,
//             NULL AS note,
//             MAX(induP.created_at) AS created_at,
//             NULL AS updated_at,
//             'ผลิตตามใบสั่งผลิต' AS name,
//             'production' AS checkk
//         FROM 
//             ingredient_Used_Pro AS induP
//         WHERE 
//             induP.deleted_at IS NULL
//         GROUP BY 
//             induP.pdod_id
//     ) AS combined_results
//     ORDER BY 
//         created_at DESC;
    
//     `;

//     connection.query(query, (err, results) => {
//         if (err) {
//             console.error("MySQL Query Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }

//         return res.status(200).json(results);
//     });
// });

router.get('/usedIngredients', (req, res, next) => {
    const query = `
    SELECT * FROM (
        SELECT 
            indU.indU_id AS id,
            indU.status,
            indU.note,
            indU.created_at,
            indU.updated_at,
            'ทั่วไป' AS name,
            'other' AS checkk
        FROM 
            ingredient_used AS indU
        WHERE 
            indU.status != 0
        
        UNION ALL
        
        SELECT 
            CONCAT('PD', LPAD(pdod.pdo_id, 7, '0')) AS id,
            MAX(induP.status) AS status,
            NULL AS note,
            MAX(induP.created_at) AS created_at,
            NULL AS updated_at,
            'ผลิตตามใบสั่งผลิต' AS name,
            'production' AS checkk
        FROM 
            ingredient_used_pro AS induP
            JOIN productionorderdetail AS pdod ON pdod.pdod_id = induP.pdod_id
        WHERE 
            induP.deleted_at IS NULL
        GROUP BY 
            induP.pdod_id
    ) AS combined_results
    ORDER BY 
        created_at DESC;
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("MySQL Query Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        return res.status(200).json(results);
    });
});





//ไม่มีแก้ไขมียกเลิก
//สถานะ = 2 ยืนยันแล้ว
//เปลี่ยนมาสร้างฟังกืชันดีกว่า มีปัญหาคำนวณผิดจากอันเดิม สต๊อกไม่หัก
//30-06-24รอเช็คอีกรอบ ไม่แน่ใจอันเดิมทำยังไง ถ้าไม่มีแก้ไขก็เอาอันที่เคยเพิ่มไปหักสต๊อกเลย
//เข้าใจความคิดเดิมแล้วคือต้องการ ให้คำนวณใหม่ทุกรอบถ้ายังไม่กดยืนยันเผื่อเอาไปทำอย่างอื่น
//แต่จะเปลี่ยนลองหักจากอันเดิมเลยที่status=1
//แบบนี้น่าจะครอบคลุมมากกว่าอะ จุดบอดเยอะเกินถ้าอันนั้น ปัญหาตรงถ้าหลายรายการนี่แหละ จะคล้ายเดิมที่เคยเก็บลบ เพิ่ม แก้ไข แต่จะมีแค่แก้ไข เพราะเหมือนจะแก้ไขแค่ล็อตที่ใช้แทน
//ยุ่งยากนิดนึงแต่อาจจะให้คำนวณใหม่เหมือนวัตถุดิบที่ใช้ แล้วสร้างตัวแปรเก็บมาเทียบ แล้วลบ แก้ไข เพิ่มเอา
//หรือลองคิดหาวิธีทำเป็นฟังชันแทนแบบ status=1 แค่เก็บดดยรวม พอเปลี่ยนเป็น 2 คำนวณว่าใช้ล็อตไหนไปบ้างแทน แต่สต๊อกจะไหลผิดตอนยกเลิกอันตรงกลาง
//ไม่ได้โชว์ว่ามาจากล็อตไหนงั้นยึดตามลำดับกดยืนยันทำแบบยุ่งยาก
// router.patch('/updateStatus/:id', (req, res, next) => {
//     const indU_id = req.params.id;
//     // const ingredient_Used = req.body.ingredient_Used;

//     const updateStatusQuery = "UPDATE ingredient_Used SET status = 2 WHERE indU_id = ?";
//     connection.query(updateStatusQuery, [indU_id], (err, result) => {
//         if (err) {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }

//         const getDetailQuery = `
//         SELECT detail.*, ld.ind_id AS ind_id ,used.status as statusU
//         FROM ingredient_Used as used
//         JOIN ingredient_Used_detail AS detail ON detail.indU_id = used.indU_id 
//         JOIN ingredient_lot_detail AS ld ON ld.indlde_id = detail.indlde_id 
//         JOIN ingredient AS i ON i.ind_id = ld.ind_id 
//         WHERE detail.indU_id = ? ;
//         `;
//         // const getDetailQuery = `
//         // SELECT *.detail 
//         // FROM ingredient_Used_detail detail
//         // WHERE detail.indU_id = ? ;
//         // `;


//         connection.query(getDetailQuery, [indU_id], (err, results) => {
//             if (err) {
//                 console.error("MySQL Error:", err);
//                 return res.status(500).json({ message: "error", error: err });
//             }

//             // const detailall = [];
//             // const upind = [];
//             const detailArray = JSON.parse(JSON.stringify(results));
//             console.log(detailArray);
//             results.forEach(detail => {
//                 const query = `
//                      SELECT indlde_id, qty_stock, qty_per_unit
//                      FROM ingredient
//                      JOIN ingredient_lot_detail ON ingredient_lot_detail.ind_id = ingredient.ind_id
//                      JOIN ingredient_lot ON ingredient_lot.indl_id = ingredient_lot_detail.indl_id
//                      WHERE ingredient_lot_detail.ind_id = ? AND ingredient_lot_detail.date_exp > NOW() and qty_stock > 0 and ingredient_lot.status="2"
//                      ORDER BY ingredient_lot_detail.date_exp ASC;`;

//                 connection.query(query, [detail.ind_id], (err, results1) => {
//                     if (err) {
//                         console.error("MySQL Query Error:", err);
//                         // handle error
//                     }

//                     let indlde_id = [];
//                     const detailall = [];
//                     const upind = []

//                     // วน loop ผ่านทุกๆ แถวของผลลัพธ์
//                     let stopLoop = false; // สร้างตัวแปรเพื่อสำหรับบอกว่าควรหยุดลูปหรือไม่
//                     let new_qty_stock = 1; // สร้างตัวแปร new_qty_stock เพื่อให้สามารถเข้าถึงได้จากทั้งสองลูป
//                     //เช็คเงื่อนไขดีๆ อาจจะะให้เปลี่ยนไปมา stopLoop = false;
//                     results1.forEach(result => {
//                         if (!stopLoop) { // ตรวจสอบว่ายังไม่ควรหยุดลูป
//                             if (new_qty_stock > 0) {
//                                 const qty_per_unit = result.qty_per_unit;
//                                 const qty_used_sum = detail.qty_used_sum;
//                                 const scrap = detail.scrap;
//                                 const total_quantity_used = qty_used_sum * qty_per_unit + scrap; // ทำให้ qty_stock เป็นค่าบวก
//                                 const qty_stock = result.qty_stock;

//                                 console.log(total_quantity_used, "total_quantity_used",);
//                                 console.log(qty_stock, "qty_stock");

//                                 new_qty_stock = qty_stock - total_quantity_used;
//                                 console.log(new_qty_stock, "new_qty_stock>0");

//                                 if (new_qty_stock < 0) {
//                                     const new_qty_stockup = total_quantity_used + new_qty_stock

//                                     const itemIn = {
//                                         indUd_id: detail.indUd_id,
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
//                                     detailall.push(itemIn);

//                                     if (results.statusU == "2") {

//                                         const itemUp = {
//                                             indlde_id: result.indlde_id,
//                                             qty_stock: 0 // ใช้ค่าจากการ query
//                                         };
//                                         upind.push(itemUp);
//                                     }
//                                 } else {
//                                     const itemIn = {
//                                         indUd_id: detail.indUd_id,
//                                         indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                         indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                         qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                         scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                         qtyusesum: total_quantity_used, // ใช้ค่าที่คำนวณได้
//                                         deleted_at: null // ใช้ค่าที่คำนวณได้
//                                     };
//                                     detailall.push(itemIn);


//                                     const itemUp = {
//                                         indlde_id: result.indlde_id,
//                                         qty_stock: new_qty_stock, // ใช้ค่าจากการ query

//                                     };
//                                     upind.push(itemUp);

//                                     stopLoop = true;

//                                 }

//                             }

//                             // ตรวจสอบว่า new_qty_stock เป็น 0 หรือไม่ ถ้าเป็นให้หยุดลูป
//                             else if (new_qty_stock < 0) {
//                                 console.log(new_qty_stock, "new_qty_stock<0")
//                                 console.log(result.qty_stock, "result.qty_stock<0")

//                                 newqtystockforup = result.qty_stock + new_qty_stock;
//                                 // console
//                                 new_qty_stock = Math.abs(new_qty_stock);

//                                 const itemIn = {
//                                     indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                                     indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                                     qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                                     scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                                     qtyusesum: new_qty_stock, // ใช้ค่าที่คำนวณได้
//                                     deleted_at: null // ใช้ค่าที่คำนวณได้
//                                 };
//                                 // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
//                                 detailall.push(itemIn);

//                                 // stopLoop = true; // ตั้งค่าให้หยุดลูป
//                                 console.log(new_qty_stock, "new_qty_stock<0")

//                                 const itemUp = {
//                                     indlde_id: result.indlde_id,
//                                     qty_stock: newqtystockforup, // ใช้ค่าจากการ query

//                                 };
//                                 upind.push(itemUp);



//                             } else {
//                                 stopLoop = true;
//                             }

//                         }
//                     });

//                     console.log(detailall, "detailall")
//                     console.log(upind, "upind")
//                     //เหลือใส่ DB
//                     if (detailall.length > 0) {
//                         const insertDetailQuery = "UPDATE ingredient_Used_detail SET indU_id=?, indlde_id=?, qty_used_sum=?, scrap=?, qtyusesum=?, deleted_at=? WHERE  indUd_id =?";
//                         // const detailValues = detailall.map(item => [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at,item.indUd_id]);

//                         detailall.forEach(item => {
//                             const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, item.indUd_id]


//                             connection.query(insertDetailQuery, updateValues, (err, results) => {
//                                 if (err) {
//                                     console.error("MySQL Update Query Error:", err);
//                                     return res.status(500).json({ message: "error", error: err });
//                                 }

//                                 console.log("Updated data:", results);
//                             });
//                         });

//                     }
//                     if (upind.length > 0) {

//                         const updateQuery = " UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";
//                         // const detailValues = upind.map(item => [item.qty_stock, item.indlde_id]);
//                         // const flattenedUpdateData = upind.flat();

//                         upind.forEach(item => {
//                             const updateValues = [item.qty_stock, item.indlde_id]


//                             connection.query(updateQuery, updateValues, (err, results) => {
//                                 if (err) {
//                                     console.error("MySQL Update Query Error:", err);
//                                     return res.status(500).json({ message: "error", error: err });
//                                 }

//                                 console.log("Updated data:", results);
//                             });
//                         });

//                     }

//                 })
//             });

//             // if (detailall.length > 0) {
//             //     const insertDetailQuery = "INSERT INTO ingredient_Used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
//             //     const detailValues = detailall.map(item => [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at]);

//             //     connection.query(insertDetailQuery, [detailValues], (err, result) => {
//             //         if (err) {
//             //             console.error("Error inserting detail data:", err);
//             //             return res.status(500).json({ message: "error", error: err });
//             //         }
//             //         console.log("Detail data inserted successfully");
//             //     });
//             // }

//             // if (upind.length > 0) {
//             //     const updateQuery = "UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";

//             //     upind.forEach(item => {
//             //         const updateValues = [item.qty_stock, item.indlde_id];

//             //         connection.query(updateQuery, updateValues, (err, results) => {
//             //             if (err) {
//             //                 console.error("MySQL Update Query Error:", err);
//             //                 return res.status(500).json({ message: "error", error: err });
//             //             }
//             //             console.log("Updated data:", results);
//             //         });
//             //     });
//             // }

//             res.status(200).json({ message: "success" });
//         });
//     });
// })


//ลองเอง 2
//ในส่วนDBไม่แน่ใจกรณี+-สต็อกอื่น ลองกลับมาเทสอีกที
//.
router.patch('/updateStatus/:id', (req, res, next) => {
    const indU_id = req.params.id;

    // อัปเดตสถานะในตาราง ingredient_Used เป็น 2
    const updateStatusQuery = "UPDATE ingredient_Used SET status = 2 WHERE indU_id = ?";
    connection.query(updateStatusQuery, [indU_id], (err, result) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        // ดึงข้อมูลจากตาราง ingredient_Used_detail
        const getDetailQuery = `
        SELECT detail.*, ld.ind_id AS ind_id, used.status as statusU
        FROM ingredient_Used as used
        JOIN ingredient_Used_detail AS detail ON detail.indU_id = used.indU_id 
        JOIN ingredient_lot_detail AS ld ON ld.indlde_id = detail.indlde_id 
        JOIN ingredient AS i ON i.ind_id = ld.ind_id 
        WHERE detail.indU_id = ?;
        `;

        connection.query(getDetailQuery, [indU_id], (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ message: "error", error: err });
            }

            // สร้างตัวแปรเพื่อเก็บข้อมูลที่ไม่ซ้ำกันตาม ind_id
            const uniqueData = {};
            const indUd_ids = [];

            results.forEach(row => {
                const { ind_id, qty_used_sum, scrap, indUd_id } = row; // ดึงเฉพาะคอลัมน์ที่ต้องการ
                if (!uniqueData[ind_id]) {
                    uniqueData[ind_id] = { ind_id, qty_used_sum, scrap };
                }
                indUd_ids.push({ ind_id, indUd_id });
                // indUd_ids.push(indUd_id); // เก็บ indUd_id ใน array
            });

            // แปลง object เป็น array
            const usedtocalculate = Object.values(uniqueData); // ใช้คำนวณ
            console.log(usedtocalculate);
            console.log(indUd_ids); // แสดง indUd_id ที่เก็บมา

            //////////////////////////////
            usedtocalculate.forEach((detail, index) => {
                // const ind_id = detail.ind_id;
                // const qty_used_sum = detail.qty_used_sum;
                // const scrap = detail.scrap;

                const query = `
         SELECT indlde_id, qty_stock, qty_per_unit
         FROM ingredient
         JOIN ingredient_lot_detail ON ingredient_lot_detail.ind_id = ingredient.ind_id
         JOIN ingredient_lot ON ingredient_lot.indl_id = ingredient_lot_detail.indl_id
         WHERE ingredient_lot_detail.ind_id = ? AND ingredient_lot_detail.date_exp > NOW() and qty_stock > 0 and ingredient_lot.status="2"
         ORDER BY ingredient_lot_detail.date_exp ASC;`;

                connection.query(query, [detail.ind_id], (err, results) => {
                    if (err) {
                        console.error("MySQL Query Error:", err);
                        // handle error
                    }
                    let indlde_id = [];
                    const detailall = [];
                    const upind = []

                    // วน loop ผ่านทุกๆ แถวของผลลัพธ์
                    let stopLoop = false; // สร้างตัวแปรเพื่อสำหรับบอกว่าควรหยุดลูปหรือไม่
                    let new_qty_stock = 1; // สร้างตัวแปร new_qty_stock เพื่อให้สามารถเข้าถึงได้จากทั้งสองลูป
                    //เช็คเงื่อนไขดีๆ อาจจะะให้เปลี่ยนไปมา stopLoop = false;
                    results.forEach(result => {

                        if (!stopLoop) { // ตรวจสอบว่ายังไม่ควรหยุดลูป

                            //เปลี่ยนมาใช้ลูป ด้านล่าง อันนี้เหมือนทำได้แบบผิดพลาดแปลกๆ
                            if (new_qty_stock > 0) {
                                const qty_per_unit = result.qty_per_unit;
                                const qty_used_sum = detail.qty_used_sum;
                                const scrap = detail.scrap;
                                const total_quantity_used = qty_used_sum * qty_per_unit + scrap; // ทำให้ qty_stock เป็นค่าบวก
                                const qty_stock = result.qty_stock;

                                console.log(total_quantity_used, "total_quantity_used > 0 ---1",);
                                console.log(qty_stock, "qty_stock > 0 ---1");

                                new_qty_stock = qty_stock - total_quantity_used;
                                console.log(new_qty_stock, "new_qty_stock > 0 ---1");

                                if (new_qty_stock < 0) {
                                    const new_qty_stockup = total_quantity_used + new_qty_stock

                                    const itemIn = {
                                        indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
                                        indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                        qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                        scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                        qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
                                        deleted_at: null // ใช้ค่าที่คำนวณได้
                                    };
                                    // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
                                    detailall.push(itemIn);

                                    // if (ingredient_Used.status == "2") {

                                    const itemUp = {
                                        indlde_id: result.indlde_id,
                                        qty_stock: 0 // ใช้ค่าจากการ query
                                    };
                                    upind.push(itemUp);
                                    // }
                                } else {
                                    const itemIn = {
                                        indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
                                        indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                        qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                        scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                        qtyusesum: total_quantity_used, // ใช้ค่าที่คำนวณได้
                                        deleted_at: null // ใช้ค่าที่คำนวณได้
                                    };
                                    detailall.push(itemIn);

                                    // if (ingredient_Used.status == "2") {

                                    const itemUp = {
                                        indlde_id: result.indlde_id,
                                        qty_stock: new_qty_stock, // ใช้ค่าจากการ query

                                    };
                                    upind.push(itemUp);
                                    // }
                                    stopLoop = true;

                                }

                            }

                            // ตรวจสอบว่า new_qty_stock เป็น 0 หรือไม่ ถ้าเป็นให้หยุดลูป
                            //
                            else if (new_qty_stock < 0) {
                                console.log(new_qty_stock, "new_qty_stock<0 ---2")
                                console.log(result.qty_stock, "result.qty_stock<0 ---2")
                                //ก็อบมาเพื่อใช้กรณรี == 0
                                let new_qty_stockup = new_qty_stock
                                // newqtystockforup = result.qty_stock + new_qty_stock;
                                new_qty_stock = result.qty_stock + new_qty_stock;
                                // new_qty_stock = Math.abs(new_qty_stock);
                                // ถ้าค่า>=0
                                if (new_qty_stock > 0) {

                                    console.log(new_qty_stockup, "new_qty_stock > 0 ---2")
                                    new_qty_stockup = Math.abs(new_qty_stockup);
                                    const itemIn = {
                                        indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
                                        indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                        qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                        scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                        qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
                                        deleted_at: null // ใช้ค่าที่คำนวณได้
                                    };
                                    detailall.push(itemIn);

                                    // if (ingredient_Used.status == "2") {

                                    const itemUp = {
                                        indlde_id: result.indlde_id,
                                        qty_stock: new_qty_stock, // ใช้ค่าจากการ query

                                    };
                                    upind.push(itemUp);
                                    // }

                                    stopLoop = true;

                                    // }else if (newqtystockforup < 0){
                                    // ถ้าค่าน้อยกว่า 0
                                } else if (new_qty_stock == 0) {
                                    console.log(new_qty_stockup, "new_qty_stockupM == 0 ---2")
                                    new_qty_stockup = Math.abs(new_qty_stockup);

                                    const itemIn = {
                                        indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
                                        indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                        qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                        scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                        qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
                                        deleted_at: null // ใช้ค่าที่คำนวณได้
                                    };
                                    detailall.push(itemIn);

                                    // if (ingredient_Used.status == "2") {

                                    const itemUp = {
                                        indlde_id: result.indlde_id,
                                        qty_stock: new_qty_stock, // ใช้ค่าจากการ query

                                    };
                                    upind.push(itemUp);
                                    // }

                                    stopLoop = true;

                                } else {
                                    console.log(new_qty_stock, "new_qty_stock < 0 วนใหม่")

                                    new_qty_stockup = Math.abs(new_qty_stock);

                                    const itemIn = {
                                        indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
                                        indlde_id: result.indlde_id, // ใช้ค่าจากการ query
                                        qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
                                        scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
                                        qtyusesum: result.qty_stock, // ใช้ค่าที่คำนวณได้
                                        deleted_at: null // ใช้ค่าที่คำนวณได้
                                    };
                                    detailall.push(itemIn);

                                    stopLoop = false;
                                }



                            } else {
                                stopLoop = true;
                            }

                        }
                    });
                    console.log(indUd_ids, 'indUd_ids');
                    console.log(detail.ind_id, 'detail.ind_id');

                    //เอาไอดีเดิมที่มีอยู่มา
                    const filteredIndUdIds = indUd_ids.filter(item => item.ind_id === detail.ind_id);
                    const indUdIdsArray = filteredIndUdIds.map(item => item.indUd_id);
                    console.log(indUdIdsArray, 'indUdIdsArray');

                    console.log(detailall, "detailall")
                    console.log(upind, "upind")


                    const updateDetails = (updateQuery, updateValues, res) => {
                        connection.query(updateQuery, updateValues, (err, results) => {
                            if (err) {
                                console.error("MySQL Update Query Error:", err);
                                return res.status(500).json({ message: "error", error: err });
                            }
                            console.log("Updated data:", results);
                        });
                    };

                    if (indUdIdsArray.length === detailall.length) {
                        // Update existing records
                        detailall.forEach((item, index) => {
                            const updateQuery = "UPDATE ingredient_Used_detail SET indU_id = ?, indlde_id = ?, qty_used_sum = ?, scrap = ?, qtyusesum = ?, deleted_at = ? WHERE indUd_id = ?";
                            const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, indUdIdsArray[index]];
                            console.log("indUdIdsArray[index] ==", indUdIdsArray[index]);
                            updateDetails(updateQuery, updateValues, res);
                        });
                    } else if (indUdIdsArray.length > detailall.length) {
                        // Update existing records and mark the rest as deleted
                        detailall.forEach((item, index) => {
                            const updateQuery = "UPDATE ingredient_Used_detail SET indU_id = ?, indlde_id = ?, qty_used_sum = ?, scrap = ?, qtyusesum = ?, deleted_at = ? WHERE indUd_id = ?";
                            const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, indUdIdsArray[index]];
                            console.log("indUdIdsArray[index] >", indUdIdsArray[index]);

                            updateDetails(updateQuery, updateValues, res);
                        });

                        const excessIds = indUdIdsArray.slice(detailall.length);
                        excessIds.forEach(indUd_id => {
                            const deleteQuery = "UPDATE ingredient_Used_detail SET deleted_at = ? WHERE indUd_id = ?";
                            const deleteValues = [getCurrentDateTime(), indUd_id];
                            updateDetails(deleteQuery, deleteValues, res);
                        });
                    } else {
                        // Update existing records and insert new ones
                        indUdIdsArray.forEach((indUd_id, index) => {
                            const item = detailall[index];
                            const updateQuery = "UPDATE ingredient_Used_detail SET indU_id = ?, indlde_id = ?, qty_used_sum = ?, scrap = ?, qtyusesum = ?, deleted_at = ? WHERE indUd_id = ?";
                            const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, indUd_id];
                            console.log("indUdIdsArray[index] <", indUdIdsArray[index]);

                            updateDetails(updateQuery, updateValues, res);
                        });

                        const newItems = detailall.slice(indUdIdsArray.length);
                        if (newItems.length > 0) {
                            const insertDetailQuery = "INSERT INTO ingredient_Used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
                            const detailValues = newItems.map(item => [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at]);
                            connection.query(insertDetailQuery, [detailValues], (err, result) => {
                                if (err) {
                                    console.error("Error inserting detail data:", err);
                                    return res.status(500).json({ message: "error", error: err });
                                }
                                console.log("Detail data inserted successfully");
                            });
                        }
                    }

                    // if (ingredient_Used.status == "2" || 2) {
                    if (upind.length > 0) {
                        const updateQuery = "UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";
                        upind.forEach(item => {
                            const updateValues = [item.qty_stock, item.indlde_id];
                            updateDetails(updateQuery, updateValues, res);
                        });
                    }
                    // }
                    //เหลือใส่ DB
                    // if (detailall.length > 0) {
                    //     const insertDetailQuery = "INSERT INTO ingredient_Used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
                    //     const detailValues = detailall.map(item => [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at]);

                    //     connection.query(insertDetailQuery, [detailValues], (err, result) => {
                    //         if (err) {
                    //             console.error("Error inserting detail data:", err);
                    //             // Handle error
                    //         } else {
                    //             console.log("Detail data inserted successfully");
                    //             // Proceed with other operations or respond to the client
                    //         }
                    //     });

                    // }
                    // if (ingredient_Used.status == "2" || 2) {

                    //     if (upind.length > 0) {

                    //         const updateQuery = " UPDATE ingredient_lot_detail SET qty_stock = ? WHERE indlde_id = ?";
                    //         // const detailValues = upind.map(item => [item.qty_stock, item.indlde_id]);
                    //         // const flattenedUpdateData = upind.flat();

                    //         upind.forEach(item => {
                    //             const updateValues = [item.qty_stock, item.indlde_id]


                    //             connection.query(updateQuery, updateValues, (err, results) => {
                    //                 if (err) {
                    //                     console.error("MySQL Update Query Error:", err);
                    //                     return res.status(500).json({ message: "error", error: err });
                    //                 }

                    //                 console.log("Updated data:", results);
                    //             });
                    //         });

                    //     }
                    // }

                })

            });

            //////////////////////////////

            res.status(200).json({ message: "Status updated and details fetched successfully", data: usedtocalculate, indUd_ids: indUd_ids });
        });
    });
});
//เอาออกมา
// if (!stopLoop) { // ตรวจสอบว่ายังไม่ควรหยุดลูป

//     //เปลี่ยนมาใช้ลูป ด้านล่าง อันนี้เหมือนทำได้แบบผิดพลาดแปลกๆ
//     if (new_qty_stock > 0) {
//         const qty_per_unit = result.qty_per_unit;
//         const qty_used_sum = detail.qty_used_sum;
//         const scrap = detail.scrap;
//         const total_quantity_used = qty_used_sum * qty_per_unit + scrap; // ทำให้ qty_stock เป็นค่าบวก
//         const qty_stock = result.qty_stock;

//         console.log(total_quantity_used, "total_quantity_used > 0",);
//         console.log(qty_stock, "qty_stock > 0");

//         new_qty_stock = qty_stock - total_quantity_used;
//         console.log(new_qty_stock, "new_qty_stock > 0");

//         if (new_qty_stock < 0) {
//             const new_qty_stockup = total_quantity_used + new_qty_stock

//             const itemIn = {
//                 indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                 indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                 qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                 scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                 qtyusesum: new_qty_stockup, // ใช้ค่าที่คำนวณได้
//                 deleted_at: null // ใช้ค่าที่คำนวณได้
//             };
//             // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
//             detailall.push(itemIn);

//             // if (ingredient_Used.status == "2") {

//             //     const itemUp = {
//             //         indlde_id: result.indlde_id,
//             //         qty_stock: 0 // ใช้ค่าจากการ query
//             //     };
//             //     upind.push(itemUp);
//             // }
//         } else {
//             const itemIn = {
//                 indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//                 indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//                 qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//                 scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//                 qtyusesum: total_quantity_used, // ใช้ค่าที่คำนวณได้
//                 deleted_at: null // ใช้ค่าที่คำนวณได้
//             };
//             detailall.push(itemIn);

//             // if (ingredient_Used.status == "2") {

//             //     const itemUp = {
//             //         indlde_id: result.indlde_id,
//             //         qty_stock: new_qty_stock, // ใช้ค่าจากการ query

//             //     };
//             //     upind.push(itemUp);
//             // }
//             stopLoop = true;

//         }

//     }

//     // ตรวจสอบว่า new_qty_stock เป็น 0 หรือไม่ ถ้าเป็นให้หยุดลูป
//     //
//     else if (new_qty_stock < 0) {
//         console.log(new_qty_stock, "new_qty_stock<0")
//         console.log(result.qty_stock, "result.qty_stock<0")

//         newqtystockforup = result.qty_stock + new_qty_stock;
//         console.log(newqtystockforup, "newqtystockforup")

//         // console
//         new_qty_stock = Math.abs(new_qty_stock);

//         const itemIn = {
//             indU_id: indU_id, // ใช้ค่าจากตัวแปรนอกลูป
//             indlde_id: result.indlde_id, // ใช้ค่าจากการ query
//             qty_used_sum: detail.qty_used_sum, // ใช้ค่าจากตัวแปรนอกลูป
//             scrap: detail.scrap, // ใช้ค่าจากตัวแปรนอกลูป
//             qtyusesum: new_qty_stock, // ใช้ค่าที่คำนวณได้
//             deleted_at: null // ใช้ค่าที่คำนวณได้
//         };
//         // เพิ่มอ็อบเจ็กต์ลงในอาร์เรย์
//         detailall.push(itemIn);

//         // stopLoop = true; // ตั้งค่าให้หยุดลูป
//         if (newqtystockforup > 0) {
//             console.log(new_qty_stock, "new_qty_stock < 0")
//             stopLoop = true;

//             // }else if (newqtystockforup < 0){
//             //     stopLoop = false;
//         } else {
//             stopLoop = false;
//         }
//         // if (ingredient_Used.status == "2") {

//         //     const itemUp = {
//         //         indlde_id: result.indlde_id,
//         //         qty_stock: newqtystockforup, // ใช้ค่าจากการ query

//         //     };
//         //     upind.push(itemUp);
//         // }



//     } else {
//         stopLoop = true;
//     }

// }






//แสดง ดีเทล
router.get('/detailuse/:id', (req, res, next) => {
    const indU_id = req.params.id;
    try {
        var query = `SELECT un.* , ind.*, indd.* , indud.*, indu.* ,
        CONCAT('PU', LPAD(indud.indU_id, 6, '0')) AS indU_id_name,
        unit1.un_name AS un_purchased_name,
        unit2.un_name AS un_ind_name ,
        indu.status as status ,ind.ind_name as ind_name   ,
        CONCAT('L', LPAD(indd.indl_id, 7, '0')) AS indl_id_name     
        FROM unit AS un
        JOIN ingredient AS ind ON ind.un_ind = un.un_id
        JOIN ingredient_lot_detail AS indd ON indd.ind_id = ind.ind_id
        JOIN ingredient_Used_detail AS indud ON indud.indlde_id = indd.indlde_id 
        JOIN ingredient_Used AS indu ON indu.indU_id = indud.indU_id 
        LEFT JOIN unit AS unit1 ON ind.un_purchased = unit1.un_id
        LEFT JOIN unit AS unit2 ON ind.un_ind = unit2.un_id
        WHERE indud.indU_id = ?;
    `;

        connection.query(query, indU_id, (err, results) => {
            if (!err) {
                // res.json(results);

                // // กรองแถวของ smd ที่ deleted_at เท่ากับ null
                const filteredResults = results.filter(item => item.deleted_at === null);

                if (filteredResults.length === 0) {
                    return res.status(404).json({ message: 'sm not found' });
                }

                // ดำเนินการสร้างโครงสร้าง JSON ที่ถูกต้อง
                const formattedResult = {
                    status: filteredResults[0].status,
                    indu_id_name: filteredResults[0].indU_id_name,


                    detail: filteredResults.map(item => ({
                        ingredients_name: item.ind_name,
                        qty_used_sum: item.qty_used_sum,
                        un_purchased: item.un_purchased_name,
                        scrap: item.scrap,
                        un_ind_name: item.un_ind_name,
                        lot: item.indl_id_name,
                        qtyusesum: item.qtyusesum
                        // ind_id: item.ind_id ,
                        // un_id: item.un_id,
                        // ind_name: item.ind_name
                    }))
                };

                // // If the product contains picture data
                // if (formattedResult.picture) {
                //     // Include the base64-encoded picture data in the response
                //     formattedResult.picture = `data:image/jpeg;base64,${formattedResult.picture}`;
                // }
                console.log(req.session)
                return res.status(200).json(formattedResult)
            } else {
                console.error('Error retrieving sm:', err);
                return res.status(500).json({ message: 'Error retrieving sm', error: err });
            }
        });
    } catch (error) {
        console.error('Error retrieving sm:', error);
        return res.status(500).json({ message: 'Error retrieving sm', error });
    }

})

// =0 ยกเลิก
router.patch('/updateStatusnotuse/:id', (req, res, next) => {
    const indU_id = req.params.id;

    const Query = "select status from ingredient_Used where indU_id=? ";
    connection.query(Query, [indU_id], (err, result) => {
        console.log(result)
        if (result.status == '1' || 1) {
            const updateStatusQuery = "UPDATE ingredient_Used SET status = 0 WHERE indU_id = ? AND status = '1'";
            connection.query(updateStatusQuery, [indU_id], (err, result) => {
                if (err) {
                    console.error("MySQL Error", err);
                    return res.status(500).json({ message: "error", error: err });
                }

                const getDetailQuery = `
            SELECT detail.indUd_id 
            FROM ingredient_Used_detail AS detail
            WHERE detail.indU_id = ? ;
            `;

                let id;
                const deleteid = []
                connection.query(getDetailQuery, [indU_id], (err, results) => {
                    if (err) {
                        console.error("MySQL Error:", err);
                        return res.status(500).json({ message: "error", error: err });
                    }
                    id = results.map(result => result.indUd_id);
                    console.log(id, "id")
                    id.forEach(detail => {
                        deleteid.push(detail)
                    })
                    console.log(deleteid.length, "deleteid.length")
                    if (deleteid.length > 0) {
                        const deleteQuery = "UPDATE ingredient_Used_detail SET deleted_at = CURRENT_TIMESTAMP WHERE indUd_id  = ?";
                        deleteid.forEach(detail => {
                            const deleteValues = [detail];
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
                    res.status(200).json({ message: "test up = 0" });
                });
            });
        } else {
            res.status(200).json({ message: "stutus !=1 " });
        }
    });
});

//ลองฟังก์ชัน +- ค่า สต๊อก ingredient

function newstockingredient(req, res) {

    // const { quantity, price, totalQuantity } = req.body;
    // // คำนวณต้นทุนวัตถุดิบ
    // const materialCost = (quantity * (price / totalQuantity)).toFixed(2);
    // // ส่งผลลัพธ์กลับในรูปแบบ JSON
    // res.json({ materialCost });
}



// ลองค้นหา
router.get('/ingredient/search', (req, res) => {
    const searchTerm = req.query.ind_name;
    const sql = `SELECT * FROM ingredient WHERE ind_name LIKE '%${searchTerm}%'`;

    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(result);
    });
});
//ยังไม่ได้
router.get('/ingredientlot/search', (req, res) => {
    const searchTerm = req.query.created_at;
    const sql = `SELECT * FROM ingredient_lot WHERE created_at LIKE '%${searchTerm}%'`;

    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(result);
    });
});



// module.exports = router;
module.exports = {
    router,
    Updateqtystock
}