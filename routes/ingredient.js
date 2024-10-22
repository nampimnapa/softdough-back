const express = require("express");
const connection = require("../connection");
const router = express.Router();
const { isALL, ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder, isAdminUserOrder, } = require('../middleware')


router.post('/unit', (req, res, next) => {
    const units = req.body;

    const query = "INSERT INTO unit (un_name, type) VALUES (?, ?)";

    const insertionPromises = [];

    for (const type in units) {
        if (units.hasOwnProperty(type)) {
            const details = units[type].detail;

            details.forEach(un_name => {
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
    let status = "1";

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

//อ่านวัตถุดิบทั้งหมด
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


//ลองแบบรวม detaillot เอา stock ของ detail มาบวก
//แยกเป็นฟังก์ชันเลยให้ทำตลอด ไม่ใช้
router.get('/readall', (req, res, next) => {
    var query = `
    SELECT 
        ingredient.ind_id,
        SUM(ingredient_lot_detail.qty_stock) AS total_stock,
        ingredient.ind_name,
        (SUM(ingredient_lot_detail.qty_stock) DIV ingredient.qty_per_unit) AS ind_stock,        unit1.un_name AS un_purchased_name,
        unit2.un_name AS un_ind_name ,
        ingredient.status,
        ingredient.qtyminimum,
        ingredient_lot_detail.date_exp as date_exp
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
    AND ingredient_lot_detail.date_exp > NOW()
    
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

//ไปใช้แค่ใน read all หรืออาจไปใช้ที่อื่นได้แต่เช็คดีๆ แต่เอาไว้แค่ตอนreadก่อน นึกออกแค่ยังไงหน้าเว็บก็แสดงตรงนั้น
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
            and
                ingredient_lot_detail.date_exp > NOW()
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
        // console.log("checkMinimumIngredient in Updateqtystock");

    } catch (error) {
        console.error('MySQL Error:', error);
    }
};


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
router.get('/unit', (req, res, next) => {
    var query = 'select * from unit where type="1"'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})


// แก้ไขวัตถุดิบ
router.patch('/update/:id', (req, res, next) => {
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
//readlotdetail หน้าดูวัตถุดิบตามล็อต
router.get('/readlotdetail', async (req, res, next) => {
    console.log("Reading lot details");
    try {
        const query = `
        SELECT 
            CONCAT('L', LPAD(il.indl_id, 7, '0')) AS indl_id_name,
            i.ind_name, il.qty_stock, i.qty_per_unit,
            ROUND(il.qty_stock / i.qty_per_unit) AS stock_quantity,
            DATE_FORMAT(il.date_exp, '%Y-%m-%d') AS date_exp
        FROM 
            ingredient_lot_detail il
        JOIN
            ingredient i ON il.ind_id = i.ind_id
        `;

        const [results] = await connection.promise().query(query);

        return res.status(200).json(results);

    } catch (error) {
        console.error('MySQL Error:', error);
        return res.status(500).json({ message: "Database error", error: error.message });
    }
});



// สถานะ lot จาก1 =2 ให้ใช้งานล็อตนั้นได้
router.put('/updateIngredientLotStatus/:id', (req, res, next) => {
    const ingredientLotId = req.params.id;

    // Check if ingredient lot exists
    const checkQuery = "SELECT * FROM ingredient_lot WHERE indl_id = ?";
    connection.query(checkQuery, [ingredientLotId], (err, results) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
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
        DATE_FORMAT(update_at, '%Y-%m-%d') AS update_at
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

//ลองแก้อันบนเป็น soft delete
//ได้ละเหลือแก้ตรงแสดงให้ไม่เลือกอันที่มี delete_at

//มาเพิ่มหักเข้า-ออก ใน lot เพิ่ม status และใส่เงื่อนไขใน in up
router.patch('/editData/:indl_id', (req, res, next) => {
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

// แก้ตาม user บอกคือส่งไปเป็นหน่วย่อย
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

            // คำนวณ qty_used_sum และ scrap จาก qtyusedgrum
            const qtyusedgrum = detail.qtyusedgrum; // รับค่า qtyusedgrum จาก request
            let qty_used_sum = Math.floor(qtyusedgrum / results[0].qty_per_unit); // คำนวณ qty_used_sum
            let scrap = qtyusedgrum % results[0].qty_per_unit; // คำนวณเศษเป็น scrap

            // วนลูปผ่านผลลัพธ์จาก query
            for (const result of results) {
                if (!stopLoop) {
                    if (new_qty_stock > 0) {
                        const total_quantity_used = qty_used_sum * results[0].qty_per_unit + scrap;
                        const qty_stock = result.qty_stock;

                        new_qty_stock = qty_stock - total_quantity_used;

                        if (new_qty_stock < 0) {
                            const new_qty_stockup = total_quantity_used + new_qty_stock;

                            detailall.push({
                                indU_id: indU_id,
                                indlde_id: result.indlde_id,
                                qty_used_sum: qty_used_sum,
                                scrap: scrap,
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
                                qty_used_sum: qty_used_sum,
                                scrap: scrap,
                                qtyusesum: total_quantity_used,
                                deleted_at: null
                            });

                            if (ingredient_Used.status == "2") {
                                upind.push({ indlde_id: result.indlde_id, qty_stock: new_qty_stock });
                            }

                            stopLoop = true;
                        }
                    } else {
                        stopLoop = true;
                    }
                }
            }
        }

        // แทรกรายละเอียด detailall ลงในฐานข้อมูล
        if (detailall.length > 0) {
            const insertDetailQuery = "INSERT INTO ingredient_used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
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

    } catch (err) {
        console.error("ข้อผิดพลาด MySQL:", err);
        return res.status(500).json({ message: "error", error: err });
    }
});



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
        productionorder as pdo
    JOIN 
        productionorderdetail as pdod ON pdod.pdo_id = pdo.pdo_id
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
                //+-เกินเสีย
                const N = (row.qty + row.over) - row.broken;
                const M = row.produced_qty;
                const qty_per_unit = row.qty_per_unit;

                const Qx_prime = (Qx * N) / M;
                const qty_used_sum = Math.floor(Qx_prime / qty_per_unit);
                // const scrap = Qx_prime % qty_per_unit;
                console.log(Qx_prime);
                console.log(qty_per_unit, 'qty_per_unit');

                // แทนที่ Math.trunc ด้วยเงื่อนไขในการตรวจสอบเศษทศนิยม
                let scrap = Qx_prime % qty_per_unit;

                if (scrap !== 0) {
                    // ถ้า scrap เป็นทศนิยม และไม่ใช่ 0 ให้คงค่าที่ได้จากการ modulo
                    scrap = scrap; // หรือค่าที่ต้องการเก็บ
                } else {
                    // ถ้า scrap เป็น 0 ให้ปรับค่าใหม่ตามที่ต้องการ
                    scrap = qty_per_unit; // เช่น เปลี่ยนเป็น qty_per_unit หากไม่ต้องการให้เป็น 0
                }
                
                finalResults.push({
                    pd_name: row.pd_name,
                    qtypd_name: row.qty,
                    qtybroken: row.broken,
                    qtyover: row.over,
                    resultqty: N,
                    pdod_id: parseInt(pdod_id, 10),
                    ind_name: row.ind_name,
                    ind_id: row.ind_id,
                    qty_used_sum: qty_used_sum,
                    scrap: scrap,
                    pdo_id: pdo_id
                });
            });
        });

        console.log(finalResults);



        res.status(200).json({ finalResults: finalResults });
    });

});



//detailLotused ยัง
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
    JOIN 
        ingredient_used_detail as iud ON iup.indlde_id = iud.indlde_id
    JOIN 
        productionorderdetail as pdod ON iup.pdod_id = pdod.pdod_id	
    JOIN 
        productionorder as pdo ON pdo.pdo_id = pdod.pdo_id	
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


//แก้ไขรายละเอียดวัตถุดิบที่ใช้ตามล็อต เปลี่ยนไปแก้ไขตรง ui แล้วส่งมาเพิ่มทีเดียว
//เพิ่มตามล้อต
//เพิ่มได้แล้วยังไม่เช็คคำนวณ
//status pdo = 4 แล้ว
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
                const insertDetailQuery = "INSERT INTO ingredient_used_pro ( indlde_id, pdod_id, qty_used_sum, scrap, qtyusesum,status, deleted_at) VALUES ?";
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

                const updatestatusQuery = " UPDATE productionorder SET pdo_status = 4 WHERE pdo_id = ?";


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
            //เพิ่มในส่วนเช็คสต๊อก เพื่อแจ้งเตือน
            // checkMinimumIngredient()
            //import ภายใน
            // เรียกฟังก์ชันแจ้งเตือน
            const { checkAndAddNotifications } = require('../routes/notification');

            const io = req.app.locals.io;
            // ในไฟล์ ingredient.js
            checkAndAddNotifications(io);

        })
    });
    // if (!err) {
    res.status(200).json({ message: "success" });
    // }



})

//ดูวัตถุดิบที่ใช้all
router.get('/usedIngredients', async (req, res, next) => {
    const query = `
    SELECT * FROM (
        SELECT 
            indU.indU_id AS id,
            indU.status,
            indU.note,
            DATE_FORMAT(indU.created_at, '%Y-%m-%d') as created_at,
            indU.created_at as checkdate,
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
            DATE_FORMAT(MAX(induP.created_at), '%Y-%m-%d') AS created_at,
            MAX(induP.created_at) as checkdate,
            NULL AS updated_at,
            'ผลิตตามใบสั่งผลิต' AS name,
            'production' AS checkk
        FROM 
            ingredient_used_pro AS induP
            JOIN productionorderdetail AS pdod ON pdod.pdod_id = induP.pdod_id
        WHERE 
            induP.deleted_at IS NULL
        GROUP BY 
            pdod.pdo_id
    ) AS combined_results
    ORDER BY 
    checkdate DESC;
    `;

    try {
        const [results] = await connection.promise().query(query);
        return res.status(200).json(results);
    } catch (err) {
        console.error("MySQL Query Error:", err);
        return res.status(500).json({ message: "error", error: err.message });
    }
});


//ลองเอง 2
//ในส่วนDBไม่แน่ใจกรณี+-สต็อกอื่น ลองกลับมาเทสอีกที
//.
router.patch('/updateStatus/:id', (req, res, next) => {
    const indU_id = req.params.id;

    // อัปเดตสถานะในตาราง ingredient_Used เป็น 2
    const updateStatusQuery = "UPDATE ingredient_used SET status = 2 WHERE indU_id = ?";
    connection.query(updateStatusQuery, [indU_id], (err, result) => {
        if (err) {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }

        // ดึงข้อมูลจากตาราง ingredient_Used_detail
        const getDetailQuery = `
        SELECT detail.*, ld.ind_id AS ind_id, used.status as statusU
        FROM ingredient_used as used
        JOIN ingredient_used_detail AS detail ON detail.indU_id = used.indU_id 
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
                            const updateQuery = "UPDATE ingredient_used_detail SET indU_id = ?, indlde_id = ?, qty_used_sum = ?, scrap = ?, qtyusesum = ?, deleted_at = ? WHERE indUd_id = ?";
                            const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, indUdIdsArray[index]];
                            console.log("indUdIdsArray[index] ==", indUdIdsArray[index]);
                            updateDetails(updateQuery, updateValues, res);
                        });
                    } else if (indUdIdsArray.length > detailall.length) {
                        // Update existing records and mark the rest as deleted
                        detailall.forEach((item, index) => {
                            const updateQuery = "UPDATE ingredient_used_detail SET indU_id = ?, indlde_id = ?, qty_used_sum = ?, scrap = ?, qtyusesum = ?, deleted_at = ? WHERE indUd_id = ?";
                            const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, indUdIdsArray[index]];
                            console.log("indUdIdsArray[index] >", indUdIdsArray[index]);

                            updateDetails(updateQuery, updateValues, res);
                        });

                        const excessIds = indUdIdsArray.slice(detailall.length);
                        excessIds.forEach(indUd_id => {
                            const deleteQuery = "UPDATE ingredient_used_detail SET deleted_at = ? WHERE indUd_id = ?";
                            const deleteValues = [getCurrentDateTime(), indUd_id];
                            updateDetails(deleteQuery, deleteValues, res);
                        });
                    } else {
                        // Update existing records and insert new ones
                        indUdIdsArray.forEach((indUd_id, index) => {
                            const item = detailall[index];
                            const updateQuery = "UPDATE ingredient_used_detail SET indU_id = ?, indlde_id = ?, qty_used_sum = ?, scrap = ?, qtyusesum = ?, deleted_at = ? WHERE indUd_id = ?";
                            const updateValues = [item.indU_id, item.indlde_id, item.qty_used_sum, item.scrap, item.qtyusesum, item.deleted_at, indUd_id];
                            console.log("indUdIdsArray[index] <", indUdIdsArray[index]);

                            updateDetails(updateQuery, updateValues, res);
                        });

                        const newItems = detailall.slice(indUdIdsArray.length);
                        if (newItems.length > 0) {
                            const insertDetailQuery = "INSERT INTO ingredient_used_detail (indU_id, indlde_id, qty_used_sum, scrap, qtyusesum, deleted_at) VALUES ?";
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

            // เรียกฟังก์ชันแจ้งเตือน
            const { checkAndAddNotifications } = require('../routes/notification');

            const io = req.app.locals.io;
            // ในไฟล์ ingredient.js
            checkAndAddNotifications(io);


        });
    });
});


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
        JOIN ingredient_used_detail AS indud ON indud.indlde_id = indd.indlde_id 
        JOIN ingredient_used AS indu ON indu.indU_id = indud.indU_id 
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

    const Query = "select status from ingredient_used where indU_id=? ";
    connection.query(Query, [indU_id], (err, result) => {
        console.log(result)
        if (result.status == '1' || 1) {
            const updateStatusQuery = "UPDATE ingredient_used SET status = 0 WHERE indU_id = ? AND status = '1'";
            connection.query(updateStatusQuery, [indU_id], (err, result) => {
                if (err) {
                    console.error("MySQL Error", err);
                    return res.status(500).json({ message: "error", error: err });
                }

                const getDetailQuery = `
            SELECT detail.indUd_id 
            FROM ingredient_used_detail AS detail
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
                        const deleteQuery = "UPDATE ingredient_used_detail SET deleted_at = CURRENT_TIMESTAMP WHERE indUd_id  = ?";
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


//ขั้นต่ำ
router.get('/ingredientmini', async (req, res) => {
    const sql =
        `SELECT * FROM (
        -- First Query for ingredient_used_pro
        SELECT 
            indp.indup_id AS id,  -- Select specific columns instead of indp.*
            indp.status,
            indp.qtyusesum AS qtyusesum,  -- Rename the column to match with the second query
            DATE_FORMAT(indp.created_at, '%Y-%m-%d') as created_at,
            indp.updated_at,
            'ตามล็อต' AS name,  -- Static value for 'name'
            'ingredient_used_pro' AS checkk,  -- Static value for 'checkk'
            i.ind_name,  -- ind_name from ingredients table
            i.qty_per_unit,
            i.ind_id
        FROM 
            ingredient_used_pro indp
        JOIN 
            ingredient_lot_detail indde ON indp.indlde_id = indde.indlde_id
        JOIN          
            ingredient i ON i.ind_id = indde.ind_id 
        WHERE 
            indp.created_at >= CURDATE() - INTERVAL 14 DAY
            AND indp.status = 2
        
        UNION ALL
        
        -- Second Query for ingredient_used_detail
        SELECT 
            indu.indud_id AS id,  -- Select specific columns instead of indu.*
            iu.status,
            indu.qtyusesum,
            DATE_FORMAT(indu.created_at, '%Y-%m-%d') as created_at,
            indu.updated_at,
            'อื่นๆ' AS name,  -- Static value for 'name'
            'ingredient_used_detail' AS checkk,  -- Static value for 'checkk'
            i.ind_name , -- ind_name from ingredients table
            i.qty_per_unit,
            i.ind_id

        FROM 
            ingredient_used_detail indu
        JOIN 
            ingredient_used iu ON iu.indu_id = indu.indu_id
        JOIN 
            ingredient_lot_detail indde ON indu.indlde_id = indde.indlde_id
        JOIN          
            ingredient i ON i.ind_id = indde.ind_id 
        WHERE 
            indu.created_at >= CURDATE() - INTERVAL 14 DAY
            AND iu.status = 2
    ) AS combined_results
    ORDER BY created_at DESC;
    
    `;

    try {
        // Execute the query using a connection
        connection.query(sql, [], (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).send('Internal server error');
                return;
            }

            // Group the data by ind_name and calculate sumday and sumuse
            const groupedData = result.reduce((acc, item) => {
                const indName = item.ind_name;
                const qty_per_unit = item.qty_per_unit;
                const indId = item.ind_id;
                const qtyusesum = item.qtyusesum;

                console.log(acc, "acc")
                // Check if ind_name already exists in the accumulator
                const existingGroup = acc.find(group => group.ind_name === indName);

                if (existingGroup) {
                    // If ind_name exists, push the item to the detail array
                    existingGroup.detail.push(item);
                    existingGroup.sumuse += item.qtyusesum;  // Add to sumuse

                    // Create or update a map that sums qtyusesum per day
                    if (existingGroup.dailyTotals[item.created_at]) {
                        existingGroup.dailyTotals[item.created_at] += qtyusesum; // Add to existing date
                    } else {
                        existingGroup.dailyTotals[item.created_at] = qtyusesum; // New date entry
                    }

                    // Update sumday only if the date is unique
                    if (!existingGroup.uniqueDates.has(item.created_at)) {
                        existingGroup.uniqueDates.add(item.created_at);
                        existingGroup.sumday += 1;
                    }
                } else {
                    // If ind_name doesn't exist, create a new group
                    const uniqueDates = new Set([item.created_at]);  // Track unique dates
                    acc.push({
                        indId: indId,
                        ind_name: indName,
                        qty_per_unit: qty_per_unit,
                        sumuse: item.qtyusesum,  // Initialize sumuse
                        sumday: 1,  // Initialize sumday (first date)
                        detail: [item],
                        uniqueDates: uniqueDates, // Track unique dates
                        dailyTotals: { [item.created_at]: qtyusesum } // Initialize dailyTotals map

                    });
                }

                return acc;
            }, []).map(group => {
                // Calculate the average (sumuse / sumday)
                // Calculate the maximum quantity sold on any single day
                const dailyTotalsArray = Object.values(group.dailyTotals); // Get the daily totals as an array
                console.log(dailyTotalsArray, 'dailyTotals')

                //จำนวนวัตถุดิบวันที่ขายดีที่สุด  เวลาในการรอสินค้ามากที่สุด
                const maxQty = Math.max(...dailyTotalsArray); // Find the max of daily totals
                //จำนวนวัตถุดิบที่ใช้เฉลี่ยต่อวัน
                const average = group.sumuse / group.sumday;

                // const SafetyStock = average *1;

                const SafetyStock = (maxQty * 2) - (average * 1);

                const MinimumStock = (average * 1) + SafetyStock;
                const qtyperunit = group.qty_per_unit;
                const MinimumqtyStock = Math.ceil(MinimumStock / qtyperunit);
                const devind = Math.floor(MinimumStock / qtyperunit);
                const mod = MinimumStock % qtyperunit

                delete group.uniqueDates.qty_per_unit

                // Add the calculated average to the group object
                return {
                    ...group,
                    maxQty: maxQty,
                    average: average,
                    SafetyStock: SafetyStock,
                    MinimumStock: MinimumStock,
                    MinimumqtyStock: MinimumqtyStock,
                    devind: devind,  // Calculate the deviation in index
                    mod: mod
                };
            });

            // Return the grouped result as JSON
            res.json(groupedData);
        });
    } catch (error) {
        // Catch any other errors and respond with an error message
        console.error('Error:', error);
        res.status(500).send('Internal server error');
    }
});


// module.exports = router;
// module.exports.Updateqtystock = Updateqtystock;
module.exports = {
    router,
    Updateqtystock
}