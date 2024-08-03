
//เพิ่มapi สำหรับหน่วย มีประเภทหน่วย
const express = require("express");
const connection = require("../connection");

const multer = require('multer');
const router = express.Router();
const upload = multer();

const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder ,isAdminUserOrder} = require('../middleware')



router.post('/addcat', (req, res, next) => {
    let cat = req.body;
    query = "insert into productcategory (pdc_name) values(?)";
    connection.query(query, [cat.pdc_name], (err, results) => {
        if (!err) {
            return res.status(200).json({ message: "success" });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });
})

router.get('/readcat', (req, res, next) => {
    var query = 'select *from productCategory'
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
})


router.patch('/updatecat/:pdc_id', (req, res, next) => {
    const pdc_id = req.params.pdc_id;
    const sm = req.body;
    var query = "UPDATE productCategory SET pdc_name=? WHERE pdc_id=?";
    connection.query(query, [sm.pdc_name, pdc_id], (err, results) => {
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


//pd new
//กดไปเรื่อยๆ id บวกไปเรื่อยๆแบบไม่เข้าไปก็บวกไป เริ่มต้นที่8ละล่าสุด
//pd_idไม่เข้าในrecipe
//detail แอดไม่หมด ได้ตัวเดียว มีปห.recipedetail มี rc_id เป็นPK
//rc-id ใน pd ยังมี
// router.post('/addProductWithRecipe', (req, res) => {
//     const { product, recipe, recipedetail } = req.body;

//     // Start a transaction
//     connection.beginTransaction((err) => {
//         if (err) {
//             res.status(500).json({ message: 'Transaction start error', error: err });
//             return;
//         }

//         // Insert product
//         connection.query('INSERT INTO products SET ?', product, (err, productResult) => {
//             if (err) {
//                 connection.rollback(() => {
//                     res.status(500).json({ message: 'Error inserting product', error: err });
//                 });
//                 return;
//             }

//             const productId = productResult.insertId;

//             // Set pd_id for the recipe
//             recipe.pd_id = productId;

//             // Insert recipe
//             connection.query('INSERT INTO recipe SET ?', recipe, (err, recipeResult) => {
//                 if (err) {
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error inserting recipe', error: err });
//                     });
//                     return;
//                 }

//                 let recipeId = recipeResult.insertId;

//                 // Associate recipe with product
//                 connection.query(
//                     // 'UPDATE products SET rc_id = ? WHERE pd_id = ?',
//                     [recipeId, productId],
//                     (err, updateResult) => {
//                         if (err) {
//                             connection.rollback(() => {
//                                 res.status(500).json({ message: 'Error associating recipe with product', error: err });
//                             });
//                             return;
//                         }

//                         // Check if the update was successful
//                         if (updateResult.affectedRows !== 1) {
//                             connection.rollback(() => {
//                                 res.status(500).json({ message: 'Error associating recipe with product', error: 'No rows updated' });
//                             });
//                             return;
//                         }

//                         // Insert recipe details
//                         const details = recipedetail.map((detail) => ({
//                             ...detail,
//                             rc_id: recipeId,
//                         }));

//                         console.log(recipedetail)
//                         //เพิ่มได้ตัวเดียว
//                         connection.query('INSERT INTO recipedetail SET ?', details, (err) => {
//                             if (err) {
//                                 connection.rollback(() => {
//                                     res.status(500).json({ message: 'Error inserting recipe details', error: err });
//                                 });
//                                 return;
//                             }

//                             // Commit the transaction
//                             connection.commit((err) => {
//                                 if (err) {
//                                     connection.rollback(() => {
//                                         res.status(500).json({ message: 'Transaction commit error', error: err });
//                                     });
//                                     return;
//                                 }

//                                 res.json({
//                                     productId,
//                                     recipeId,
//                                     message: 'Product and recipe added successfully!',
//                                 });
//                             });
//                         });
//                         // Assuming `recipedetail` is an array of objects
//                         console.log(recipedetail);

//                         // Start the transaction
//                         connection.beginTransaction((err) => {
//                             if (err) {
//                                 res.status(500).json({ message: 'Transaction start error', error: err });
//                                 return;
//                             }

//                             // Loop through each item in the array
//                             recipedetail.forEach((detail) => {
//                                 connection.query('INSERT INTO recipedetail SET ?', details, (err, results) => {
//                                     if (err) {
//                                         connection.rollback(() => {
//                                             res.status(500).json({ message: 'Error inserting recipe details', error: err });
//                                         });
//                                         return;
//                                     }

//                                     // Check if this is the last item in the array
//                                     if (recipedetail.indexOf(detail) === recipedetail.length - 1) {
//                                         // If it's the last item, commit the transaction
//                                         connection.commit((err) => {
//                                             if (err) {
//                                                 connection.rollback(() => {
//                                                     res.status(500).json({ message: 'Transaction commit error', error: err });
//                                                 });
//                                                 return;
//                                             }

//                                             res.json({
//                                                 productId,
//                                                 recipeId,
//                                                 message: 'Product and recipe added successfully!',
//                                             });
//                                         });
//                                     }
//                                 });
//                             });
//                         });

//                     }
//                 );

//             });
//         });
//     });
// });

//ได้หลายตัวแล้ว ยังไม่มีเงื่อนไขแค่ pd
// router.post('/addProductWithRecipe', (req, res) => {
//     const { product, recipe, recipedetail } = req.body;

//     // Start a transaction
//     connection.beginTransaction((err) => {
//         if (err) {
//             res.status(500).json({ message: 'Transaction start error', error: err });
//             return;
//         }

//         // Insert product
//         connection.query('INSERT INTO products SET ?', product, (err, productResult) => {
//             if (err) {
//                 connection.rollback(() => {
//                     res.status(500).json({ message: 'Error inserting product', error: err });
//                 });
//                 return;
//             }

//             const productId = productResult.insertId;

//             // Set pd_id for the recipe
//             recipe.pd_id = productId;

//             // Insert recipe
//             connection.query('INSERT INTO recipe SET ?', recipe, (err, recipeResult) => {
//                 if (err) {
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error inserting recipe', error: err });
//                     });
//                     return;
//                 }

//                 let recipeId = recipeResult.insertId;

//                 // Set rc_id for all recipedetails
//                 // Set rc_id for all recipedetails
//                 recipedetail.forEach((detail) => {
//                     detail.rc_id = recipeId;
//                 });

//                 // Insert recipe details
//                 const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES (?, ?, ?, ?)`;
//                 recipedetail.forEach(detail => {
//                     const recipeDetailValues = [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id];
//                     connection.query(recipeDetailQuery, recipeDetailValues, (err, detailResults) => {
//                         if (err) {
//                             connection.rollback(() => {
//                                 res.status(500).json({ message: 'Error inserting recipe details', error: err });
//                             });
//                             return;
//                         }
//                     });
//                 });

//                 // Commit the transaction
//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                         return;
//                     }

//                     res.json({
//                         productId,
//                         recipeId,
//                         message: 'Product and recipe added successfully!',
//                     });
//                 });
//             });

//         });
//     });
// });



// ลองเพิ่มรูป+เงื่อนไขแค่ pd 
// router.post('/addProductWithRecipe', upload.single('picture'), (req, res) => {
//     const { product, recipe, recipedetail } = req.body;
//     const imageBase64 = req.file.buffer.toString('base64'); // Extract image data from multer
// บvกว่าใหญ่ไป กับ pdc doesn't have a default value แต่jsonได้ติดรูป
// router.post('/addProductWithRecipe', upload.single('picture'), (req, res) => {
//     const { product, recipe, recipedetail } = req.body;

//     // ตรวจสอบว่า req.file มีหรือไม่และมีคุณสมบัติ buffer หรือไม่
//     const imageBase64 = req.file && req.file.buffer ? req.file.buffer.toString('base64') : null;

//     // สร้างอ็อบเจ็กต์ผลิตภัณฑ์พร้อมคุณสมบัติรูปภาพ
//     const productWithPicture = { ...product, picture: imageBase64 };

//     connection.beginTransaction((err) => {
//         if (err) {
//             return res.status(500).json({ message: 'Transaction start error', error: err });
//         }

//         // connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
//         //     if (err) {
//         //         connection.rollback(() => {
//         //             return res.status(500).json({ message: 'Error inserting product', error: err });
//         //         });
//         //     }

//         //     const productId = productResult.insertId;
//         connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
//             if (err) {
//                 console.error('Error inserting product:', err);
//                 connection.rollback(() => {
//                     res.status(500).json({ message: 'Error inserting product', error: err });
//                 });
//                 return;
//             }

//             if (!productResult || !productResult.insertId) {
//                 console.error('Product insertion result is invalid:', productResult);
//                 connection.rollback(() => {
//                     res.status(500).json({ message: 'Invalid product insertion result' });
//                 });
//                 return;
//             }

//             const productId = productResult.insertId;


//             if (recipe) {
//                 recipe.pd_id = productId;

//                 connection.query('INSERT INTO recipe SET ?', recipe, (err, recipeResult) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Error inserting recipe', error: err });
//                         });
//                     }

//                     const recipeId = recipeResult.insertId;

//                     if (recipedetail) {
//                         const values = recipedetail.map(detail => [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id]);
//                         const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES ?`;

//                         connection.query(recipeDetailQuery, [values], (err, detailResults) => {
//                             if (err) {
//                                 connection.rollback(() => {
//                                     return res.status(500).json({ message: 'Error inserting recipe details', error: err });
//                                 });
//                             }

//                             connection.commit((err) => {
//                                 if (err) {
//                                     connection.rollback(() => {
//                                         return res.status(500).json({ message: 'Transaction commit error', error: err });
//                                     });
//                                 }

//                                 return res.json({
//                                     productId,
//                                     recipeId,
//                                     message: 'Product and recipe added successfully!',
//                                 });
//                             });
//                         });
//                     } else { 
//                         connection.commit((err) => {
//                             if (err) {
//                                 connection.rollback(() => {
//                                     return res.status(500).json({ message: 'Transaction commit error', error: err });
//                                 });
//                             }

//                             return res.json({
//                                 productId,
//                                 recipeId,
//                                 message: 'Product added successfully!',
//                             });
//                         });
//                     }
//                 });
//             } else {
//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                     }

//                     return res.json({
//                         productId,
//                         message: 'Product added successfully!',
//                     });
//                 });
//             }
//         });
//     });
// });


// module.exports = router;

// });

//ลอง resize
const sharp = require('sharp');

// router.post('/addProductWithRecipe', upload.single('picture'), async (req, res) => {
//     const { product, recipe, recipedetail } = req.body;

//     // ตรวจสอบว่า req.file มีหรือไม่และมีคุณสมบัติ buffer หรือไม่
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     if (!imageBuffer) {
//         return res.status(400).json({ message: 'No image file provided' });
//     }

//     try {
//         // Resize the image using sharp library
//         const resizedImageBuffer = await sharp(imageBuffer)
//             .resize({ width: 300, height: 300 }) // Set the desired width and height for the resized image
//             .toBuffer(); // Convert the resized image to buffer

//         const imageBase64 = resizedImageBuffer.toString('base64');

//         // สร้างอ็อบเจ็กต์ผลิตภัณฑ์พร้อมคุณสมบัติรูปภาพ
//         const productWithPicture = { ...product, picture: imageBase64 };

//         // ทำการเชื่อมต่อกับฐานข้อมูลและทำการแทรกข้อมูล
//         connection.beginTransaction((err) => {
//             // ตรวจสอบข้อผิดพลาดที่เกิดขึ้นในการเริ่ม Transaction
//             if (err) {
//                 return res.status(500).json({ message: 'Transaction start error', error: err });
//             }

//             connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
//                 if (err) {
//                     console.error('Error inserting product:', err);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error inserting product', error: err });
//                     });
//                     return;
//                 }

//                 if (!productResult || !productResult.insertId) {
//                     console.error('Product insertion result is invalid:', productResult);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Invalid product insertion result' });
//                     });
//                     return;
//                 }

//                 const productId = productResult.insertId;

//                 // ทำการ commit Transaction หากไม่มีข้อผิดพลาด
//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                     }

//                     return res.json({
//                         productId,
//                         message: 'Product added successfully!',
//                     });
//                 });
//             });
//         });
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });

// ปห pdc_id อะไรไม่รู้ เหมือนจะได้ละแต่ยังไม่มี recipe
// router.post('/addProductWithRecipe', upload.single('picture'), async (req, res) => {
//     const { pd_name, pd_qtyminimum, status, pdc_id } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     if (!imageBuffer) {
//         return res.status(400).json({ message: 'No image file provided' });
//     }

//     try {
//         const resizedImageBuffer = await sharp(imageBuffer)
//             .resize({ width: 300, height: 300 })
//             .toBuffer();

//         const imageBase64 = resizedImageBuffer.toString('base64');

//         const productWithPicture = { pd_name, pd_qtyminimum, status, pdc_id, picture: imageBase64 };

//         connection.beginTransaction((err) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Transaction start error', error: err });
//             }

//             connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
//                 if (err) {
//                     console.error('Error inserting product:', err);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error inserting product', error: err });
//                     });
//                     return;
//                 }

//                 if (!productResult || !productResult.insertId) {
//                     console.error('Product insertion result is invalid:', productResult);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Invalid product insertion result' });
//                     });
//                     return;
//                 }

//                 const productId = productResult.insertId;

//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                     }

//                     return res.json({
//                         productId,
//                         message: 'Product added successfully!',
//                     });
//                 });
//             });
//         });
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });
// ลองทีละขั้น +กรณีค่าว่าง
// router.post('/addProductWithRecipe', upload.single('picture'), async (req, res) => {
//     const { pd_name, pd_qtyminimum, status, pdc_id } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     try {
//         let imageBase64 = null;

//         // ตรวจสอบว่ามีรูปภาพที่อัปโหลดเข้ามาหรือไม่
//         if (imageBuffer) {
//             // ปรับขนาดรูปภาพ
//             const resizedImageBuffer = await sharp(imageBuffer)
//                 .resize({ width: 300, height: 300 })
//                 .toBuffer();

//             // เปลี่ยนข้อมูลรูปภาพเป็น base64
//             imageBase64 = resizedImageBuffer.toString('base64');
//         }

//         const productWithPicture = { pd_name, pd_qtyminimum, status, pdc_id, picture: imageBase64 };

//         connection.beginTransaction((err) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Transaction start error', error: err });
//             }

//             connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
//                 if (err) {
//                     console.error('Error inserting product:', err);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error inserting product', error: err });
//                     });
//                     return;
//                 }

//                 if (!productResult || !productResult.insertId) {
//                     console.error('Product insertion result is invalid:', productResult);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Invalid product insertion result' });
//                     });
//                     return;
//                 }

//                 const productId = productResult.insertId;

//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                     }

//                     return res.json({
//                         productId,
//                         message: 'Product added successfully!',
//                     });
//                 });
//             });
//         });
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });


//+recipe 
//ถ้าจะมีปห น่าจะมีแค่พวก detail ที่ส่งเป็นลิสท์ จาห tsx

// โค้ดอฟฟฟฟฟ
// router.post('/addProductWithRecipe', upload.single('picture'),async (req, res) => {
//     const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail ,picture } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     try {
//         let imageBase64 = null;

//         // ตรวจสอบว่ามีรูปภาพที่อัปโหลดเข้ามาหรือไม่
//         if (imageBuffer) {
//             // ปรับขนาดรูปภาพ
//             const resizedImageBuffer = await sharp(imageBuffer)
//                 .resize({ width: 300, height: 300 })
//                 .toBuffer();

//             // เปลี่ยนข้อมูลรูปภาพเป็น base64
//             imageBase64 = resizedImageBuffer.toString('base64');
//         }

//         const productWithPicture = { pd_name, pd_qtyminimum, status, pdc_id, picture };

//         connection.beginTransaction((err) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Transaction start error', error: err });
//             }

//             connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
//                 if (err) {
//                     console.error('Error inserting product:', err);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error inserting product', error: err });
//                     });
//                     return;
//                 }

//                 if (!productResult || !productResult.insertId) {
//                     console.error('Product insertion result is invalid:', productResult);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Invalid product insertion result' });
//                     });
//                     return;
//                 }

//                 const productId = productResult.insertId;

//                 // ถ้ามีข้อมูลของ "recipe" และ "recipedetail" ให้เพิ่มเข้าไปด้วย
//                 if (recipe && recipedetail) {
//                     // เพิ่มข้อมูลของ "recipe"
//                     connection.query('INSERT INTO recipe SET ?', { ...recipe, pd_id: productId }, (err, recipeResult) => {
//                         if (err) {
//                             connection.rollback(() => {
//                                 return res.status(500).json({ message: 'Error inserting recipe', error: err });
//                             });
//                         }

//                         const recipeId = recipeResult.insertId;

//                         // // เพิ่มข้อมูลของ "recipedetail"
//                         // const values = recipedetail.map(detail => [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id]);
//                         // const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES ?`;

//                         // connection.query(recipeDetailQuery, [values], (err, detailResults) => {
//                         //     if (err) {
//                         //         connection.rollback(() => {
//                         //             return res.status(500).json({ message: 'Error inserting recipe details', error: err });
//                         //         });
//                         //     }
//                         // เพิ่มข้อมูลของ "recipedetail"
//                         const values = recipedetail.map(detail => [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id]);
//                         const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id, deleted_at) VALUES ?`;

//                         // เพิ่ม deleted_at = null ในแต่ละรายการที่เพิ่ม
//                         const valuesWithDeletedAtNull = values.map(value => [...value, null]);

//                         connection.query(recipeDetailQuery, [valuesWithDeletedAtNull], (err, detailResults) => {
//                             if (err) {
//                                 connection.rollback(() => {
//                                     return res.status(500).json({ message: 'Error inserting recipe details', error: err });
//                                 });
//                             }


//                             connection.commit((err) => {
//                                 if (err) {
//                                     connection.rollback(() => {
//                                         return res.status(500).json({ message: 'Transaction commit error', error: err });
//                                     });
//                                 }

//                                 return res.json({
//                                     productId,
//                                     recipeId,
//                                     message: 'Product and recipe added successfully!',
//                                 });
//                             });
//                         });
//                     });
//                 } else {
//                     // ไม่มีข้อมูลของ "recipe" และ "recipedetail" ให้เพิ่มเฉพาะผลิตภัณฑ์เท่านั้น
//                     connection.commit((err) => {
//                         if (err) {
//                             connection.rollback(() => {
//                                 return res.status(500).json({ message: 'Transaction commit error', error: err });
//                             });
//                         }

//                         return res.json({
//                             productId,
//                             message: 'Product added successfully!',
//                         });
//                     });
//                 }
//             });
//         });
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });

// น้ำลองเอาโค้ดเก่ามาแปะ
router.post('/addProductWithRecipe', upload.single('picture'), async (req, res) => {
    const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail, picture } = req.body;

    try {

        const productWithPicture = { pd_name, pd_qtyminimum, status, pdc_id, picture };

        connection.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ message: 'Transaction start error', error: err });
            }

            connection.query('INSERT INTO products SET ?', productWithPicture, (err, productResult) => {
                if (err) {
                    console.error('Error inserting product:', err);
                    connection.rollback(() => {
                        res.status(500).json({ message: 'Error inserting product', error: err });
                    });
                    return;
                }

                if (!productResult || !productResult.insertId) {
                    console.error('Product insertion result is invalid:', productResult);
                    connection.rollback(() => {
                        res.status(500).json({ message: 'Invalid product insertion result' });
                    });
                    return;
                }

                const productId = productResult.insertId;
                console.log(productWithPicture)
                console.log(recipe)


                // ถ้ามีข้อมูลของ "recipe" และ "recipedetail" ให้เพิ่มเข้าไปด้วย
                if (recipe && recipedetail) {
                    // เพิ่มข้อมูลของ "recipe"
                    connection.query('INSERT INTO recipe SET ?', { ...recipe, pd_id: productId }, (err, recipeResult) => {
                        if (err) {
                            connection.rollback(() => {
                                return res.status(500).json({ message: 'Error inserting recipe', error: err });
                            });
                        }

                        const recipeId = recipeResult.insertId;

                        // // เพิ่มข้อมูลของ "recipedetail"
                        // const values = recipedetail.map(detail => [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id]);
                        // const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES ?`;

                        // connection.query(recipeDetailQuery, [values], (err, detailResults) => {
                        //     if (err) {
                        //         connection.rollback(() => {
                        //             return res.status(500).json({ message: 'Error inserting recipe details', error: err });
                        //         });
                        //     }
                        // เพิ่มข้อมูลของ "recipedetail"
                        const values = recipedetail.map(detail => [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id]);
                        const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id, deleted_at) VALUES ?`;

                        // เพิ่ม deleted_at = null ในแต่ละรายการที่เพิ่ม
                        const valuesWithDeletedAtNull = values.map(value => [...value, null]);

                        connection.query(recipeDetailQuery, [valuesWithDeletedAtNull], (err, detailResults) => {
                            if (err) {
                                connection.rollback(() => {
                                    return res.status(500).json({ message: 'Error inserting recipe details', error: err });
                                });
                            }


                            connection.commit((err) => {
                                if (err) {
                                    connection.rollback(() => {
                                        return res.status(500).json({ message: 'Transaction commit error', error: err });
                                    });
                                }

                                return res.json({
                                    productId,
                                    recipeId,
                                    message: 'Product and recipe added successfully!',
                                    status: 200
                                });
                            });
                        });
                    });
                } else {
                    // ไม่มีข้อมูลของ "recipe" และ "recipedetail" ให้เพิ่มเฉพาะผลิตภัณฑ์เท่านั้น
                    connection.commit((err) => {
                        if (err) {
                            connection.rollback(() => {
                                return res.status(500).json({ message: 'Transaction commit error', error: err });
                            });
                        }

                        return res.json({
                            productId,
                            message: 'Product added successfully!',
                            status: 200
                        });
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error resizing image:', error);
        return res.status(500).json({ message: 'Error resizing image', error });
    }
});

/////////////
// router.post('/addProductWithRecipe', upload.single('picture'), async (req, res) => {
//     const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     try {
//         let imageBase64 = null;
//         if (imageBuffer) {
//             const resizedImageBuffer = await sharp(imageBuffer)
//                 .resize({ width: 300, height: 300 })
//                 .toBuffer();

//             imageBase64 = resizedImageBuffer.toString('base64');
//         }

//         const productWithPicture = { pd_name, pd_qtyminimum, status, pdc_id, picture: imageBase64 };

//         connection.beginTransaction(async (err) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Transaction start error', error: err });
//             }

//             try {
//                 const productResult = await insertProduct(connection, productWithPicture);

//                 if (!productResult || !productResult.insertId) {
//                     console.error('Product insertion result is invalid:', productResult);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Invalid product insertion result' });
//                     });
//                     return;
//                 }

//                 const productId = productResult.insertId;

//                 if (recipe) {
//                     recipe.pd_id = productId;

//                     const recipeResult = await insertRecipe(connection, recipe);

//                     if (!recipeResult || !recipeResult.insertId) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Error inserting recipe' });
//                         });
//                         return;
//                     }

//                     const recipeId = recipeResult.insertId;

//                     if (recipedetail) {
//                         const detailResults = await insertRecipeDetails(connection, recipedetail, recipeId);

//                         if (!detailResults) {
//                             connection.rollback(() => {
//                                 return res.status(500).json({ message: 'Error inserting recipe details' });
//                             });
//                             return;
//                         }
//                     }
//                 }

//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                     }

//                     return res.json({
//                         productId,
//                         message: 'Product and recipe added successfully!',
//                     });
//                 });
//             } catch (error) {
//                 console.error('Error inserting product or recipe:', error);
//                 connection.rollback(() => {
//                     return res.status(500).json({ message: 'Error inserting product or recipe', error });
//                 });
//             }
//         });
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });

// async function insertProduct(connection, product) {
//     return new Promise((resolve, reject) => {
//         connection.query('INSERT INTO products SET ?', product, (err, result) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// }

// async function insertRecipe(connection, recipe) {
//     return new Promise((resolve, reject) => {
//         connection.query('INSERT INTO recipe SET ?', recipe, (err, result) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// }

// async function insertRecipeDetails(connection, recipedetail, recipeId) {
//     return new Promise((resolve, reject) => {
//         const values = recipedetail.map(detail => [recipeId, detail.ind_id, detail.ingredients_qty, detail.un_id]);
//         const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES ?`;

//         connection.query(recipeDetailQuery, [values], (err, result) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// }

//read

router.get('/products/:pd_id',async (req, res) => {
    const productId = req.params.pd_id;

    try {
        // Perform a database query to retrieve the product data
        connection.query('SELECT * FROM products WHERE pd_id = ?', productId, (err, results) => {
            if (err) {
                console.error('Error retrieving product:', err);
                return res.status(500).json({ message: 'Error retrieving product', error: err });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Extract product data from the database results
            const product = results[0];

            // If the product contains picture data
            if (product.picture) {
                // Include the base64-encoded picture data in the response
                product.picture = `data:image/jpeg;base64,${product.picture}`;
            }

            // Return the product data in the response
            res.json({ product });
        });
    } catch (error) {
        console.error('Error retrieving product:', error);
        return res.status(500).json({ message: 'Error retrieving product', error });
    }
});

router.get('/pdset/:pd_id', async (req, res, next) => {
    const pd_id = Number(req.params.pd_id);
    try {
        var query = `SELECT pd.* , rc.*, u.un_name as un_name  ,rcd.*,ind.ind_name as ind_name, pdc.pdc_name as pdc_name
        FROM productCategory pdc
        JOIN products pd ON pdc.pdc_id = pd.pdc_id
        JOIN recipe rc ON rc.pd_id = pd.pd_id
        JOIN recipedetail rcd ON rcd.rc_id = rc.rc_id
        JOIN ingredient ind ON ind.ind_id = rcd.ind_id
        JOIN unit u ON rc.un_id = u.un_id
        WHERE pd.pd_id = ?`;

        connection.query(query, pd_id, (err, results) => {
            if (!err) {
                // res.json(results);

                // // กรองแถวของ smd ที่ deleted_at เท่ากับ null
                const filteredResults = results.filter(item => item.deleted_at === null);

                if (filteredResults.length === 0) {
                    return res.status(404).json({ message: 'sm not found' });
                }

                // ดำเนินการสร้างโครงสร้าง JSON ที่ถูกต้อง
                const formattedResult = {
                    pd_id: filteredResults[0].pd_id,
                    pd_name: filteredResults[0].pd_name,
                    pd_qtyminimum: filteredResults[0].pd_qtyminimum,
                    pdc_name: filteredResults[0].pdc_name,
                    status: filteredResults[0].status,
                    // fix: filteredResults[0].fix,
                    picture: filteredResults[0].picture,
                    created_at: filteredResults[0].created_at,
                    updated_at: filteredResults[0].updated_at,
                    rc_id: filteredResults[0].rc_id,
                    un_name: filteredResults[0].un_name,
                    qtylifetime: filteredResults[0].qtylifetime,
                    produced_qty: filteredResults[0].produced_qty,

                    recipedetail: filteredResults.map(item => ({
                        ingredients_qty: item.ingredients_qty,
                        ind_id: item.ind_id ,
                        un_id: item.un_id,
                        ind_name: item.ind_name
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

router.get('/productsall', async (req, res, next) => {
    try {
        var query = `SELECT pd.* , rc.* 
            FROM products pd 
            JOIN recipe rc ON rc.pd_id = pd.pd_id`;

        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error retrieving sm:', err);
                return res.status(500).json({ message: 'Error retrieving sm', error: err });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'sm not found' });
            }

            // ลูกน้ำแก้ไขตรงนี้ เพราะว่ารูปที่ลูกน้ำส่งมาไม่ได้เข้ารหัสแบบ Base64 เลยต้องลบ namespace ออก
            results.forEach(result => {
                if (result.picture) {
                    // result.picture = `data:image/jpeg;base64,${result.picture}`;  => ของอายฟู
                    result.picture = `${result.picture}`; // => ของลูกน้ำ
                }
            });

            return res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error retrieving sm:', error);
        return res.status(500).json({ message: 'Error retrieving sm', error });
    }
});

// แก้ไข ยังไม่ลอง
//เปลี่ยนจาก หรือ เป็นเช็คทีละอัน ไม่สมประกอบในส่วน ดีเทล รีซีบไม่มี 
//กรณีแก้อันเดียว หรือไม่แก้ทั้งหมด
//เงื่อนไข ยังมีปัญหากรณีทั้งแอด ลบ อัปเดต ใน req เดียว
// router.patch('/editProductWithRecipe/:pd_id', upload.single('picture'), async (req, res) => {
//     const pd_id = req.params.pd_id;

//     const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     try {
//         let imageBase64 = null;

//         // ตรวจสอบว่ามีการอัปโหลดรูปภาพหรือไม่
//         if (imageBuffer) {
//             // ปรับขนาดรูปภาพ
//             const resizedImageBuffer = await sharp(imageBuffer)
//                 .resize({ width: 300, height: 300 })
//                 .toBuffer();

//             // แปลงข้อมูลรูปภาพเป็น base64
//             imageBase64 = resizedImageBuffer.toString('base64');
//         }

//         const productUpdateData = { pd_name, pd_qtyminimum, status, pdc_id };
//         console.log(productUpdateData)
//         if (imageBase64) {
//             productUpdateData.picture = imageBase64;
//         }

//         connection.beginTransaction((err) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Transaction start error', error: err });
//             }

//             connection.query('UPDATE products SET ?,updated_at = CURRENT_TIMESTAMP  WHERE pd_id = ?', [productUpdateData, pd_id], (err, productResult) => {
//                 if (err) {
//                     console.error('Error updating product:', err);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Error updating product', error: err });
//                     });
//                     return;
//                 }

//                 if (!productResult || productResult.affectedRows === 0) {
//                     console.error('Product update result is invalid:', productResult);
//                     connection.rollback(() => {
//                         res.status(500).json({ message: 'Invalid product update result' });
//                     });
//                     return;
//                 }
//                 //มีปัญหา
//                 console.log(recipe, recipedetail)
//                 if (recipe && recipedetail) {

//                     // const recipeUpdateData = { };

//                     connection.query('UPDATE recipe SET ? WHERE pd_id = ?', [recipe, pd_id], (err, recipeResult) => {
//                         if (err) {
//                             console.error('Error updating product:', err);
//                             connection.rollback(() => {
//                                 res.status(500).json({ message: 'Error updating recipe', error: err });
//                             });
//                             return;
//                         }


//                         // Check if there are recipedetails to process
//                         if (recipedetail && recipedetail.length > 0) {

//                             const indIdsInReq = recipedetail.map(detail => detail.ind_id).filter(id => id !== undefined);
//                             console.log("req", indIdsInReq)
//                             // Fetch existing ind_ids from the database for the current recipe
//                             const existingIndIdsQuery = `SELECT rd.ind_id, rd.rc_id
//                         FROM recipedetail rd 
//                         JOIN recipe r ON rd.rc_id = r.rc_id 
//                         JOIN products p ON p.pd_id = r.pd_id 
//                         where p.pd_id = ?`;
//                             connection.query(existingIndIdsQuery, pd_id, (err, existingIndIds) => {
//                                 if (err) {
//                                     connection.rollback(() => {
//                                         return res.status(500).json({ message: 'Error fetching existing ind_ids', error: err });
//                                     });
//                                 }


//                                 // const rcIdsArray = existingIndIds.map(row => row.rc_id);
//                                 // console.log("rcIdsArray", rcIdsArray);
//                                 const rcId = existingIndIds.reduce((acc, current) => current.rc_id, null);
//                                 console.log("rcId", rcId);

//                                 const existingIndIdsArray = existingIndIds.map(row => row.ind_id);
//                                 console.log("DB", existingIndIdsArray)
//                                 const indIdsToUpdate = existingIndIdsArray.filter(id => indIdsInReq.includes(id));
//                                 const indIdsToAdd = indIdsInReq.filter(id => !existingIndIdsArray.includes(id));
//                                 const indIdsToDelete = existingIndIdsArray.filter(id => !indIdsInReq.includes(id));
//                                 console.log("up", indIdsToUpdate, "add", indIdsToAdd, "de", indIdsToDelete)

//                                 const updateData = [];
//                                 const insertData = [];
//                                 const deleteData = [];

//                                 // Update recipedetail records
//                                 if (indIdsToUpdate.length > 0) {
//                                     // const updateQuery = `UPDATE recipedetail SET ?, deleted_at = NULL WHERE rc_id = ? AND ind_id IN (?)`;
//                                     // // Construct your update query and execute it
//                                     // connection.query(updateQuery, [recipedetail,rcIdsArray ,indIdsToUpdate], (err, updateResult) => {
//                                     //     if (err) {
//                                     //         connection.rollback(() => {
//                                     //             return res.status(500).json({ message: 'Error updating recipedetail', error: err });
//                                     //         });
//                                     //     }
//                                     // });
//                                     // Update recipedetail records for each detail

//                                     recipedetail.forEach(detail => {
//                                         console.log(detail)
//                                     const { ind_id, ingredients_qty, un_id } = detail;
//                                     const updateQuery = `UPDATE recipedetail SET ingredients_qty = ?, un_id = ?, deleted_at = NULL WHERE rc_id = ? AND ind_id = ?`;
//                                     // Execute the update query for each detail
//                                     connection.query(updateQuery, [ingredients_qty, un_id, rcId, ind_id], (err, updateResult) => {
//                                         if (err) {
//                                             connection.rollback(() => {
//                                                 return res.status(500).json({ message: 'Error updating recipedetail', error: err });
//                                             });
//                                         }
//                                     });
//                                     });

//                                 }


//                                 // Insert new recipedetail records
//                                 if (indIdsToAdd.length > 0) {
//                                     const insertQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES ?`;
//                                     const valuesToAdd = indIdsToAdd.map(id => [recipe.rc_id, id, ingredients_qty_value, un_id_value]);
//                                     // Insert new records into recipedetail table
//                                     connection.query(insertQuery, [valuesToAdd], (err, insertResult) => {
//                                         if (err) {
//                                             connection.rollback(() => {
//                                                 return res.status(500).json({ message: 'Error inserting new recipedetail records', error: err });
//                                             });
//                                         }
//                                     });
//                                 }

//                                 // Soft delete recipedetail records
//                                 if (indIdsToDelete.length > 0) {
//                                     const softDeleteQuery = `UPDATE recipedetail SET deleted_at = CURRENT_TIMESTAMP WHERE rc_id = ? AND ind_id IN (?)`;
//                                     // Soft delete existing records in recipedetail table
//                                     connection.query(softDeleteQuery, [recipe.rc_id, indIdsToDelete], (err, deleteResult) => {
//                                         if (err) {
//                                             connection.rollback(() => {
//                                                 return res.status(500).json({ message: 'Error soft deleting recipedetail records', error: err });
//                                             });
//                                         }
//                                     });
//                                 }
//                             });

//                         }

//                     });
//                 }

//                 // ยืนยันธุรกรรม
//                 connection.commit((err) => {
//                     if (err) {
//                         connection.rollback(() => {
//                             return res.status(500).json({ message: 'Transaction commit error', error: err });
//                         });
//                     }

//                     return res.json({
//                         productId: pd_id,
//                         message: 'Product updated successfully!',
//                     });
//                 });
//             });
//         });
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });
//ลอง เงื่อนไข ยังมีปัญหากรณีทั้งแอด ลบ อัปเดต ใน req เดียว
// ได้แยะ
router.patch('/editProductWithRecipe/:pd_id', upload.single('picture'), async (req, res) => {
    const pd_id = req.params.pd_id;

    const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail } = req.body;
    const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

    try {
        let imageBase64 = null;

        // ตรวจสอบว่ามีการอัปโหลดรูปภาพหรือไม่
        if (imageBuffer) {
            // ปรับขนาดรูปภาพ
            const resizedImageBuffer = await sharp(imageBuffer)
                .resize({ width: 300, height: 300 })
                .toBuffer();

            // แปลงข้อมูลรูปภาพเป็น base64
            imageBase64 = resizedImageBuffer.toString('base64');
        }

        const productUpdateData = { pd_name, pd_qtyminimum, status, pdc_id };
        console.log(productUpdateData)
        if (imageBase64) {
            productUpdateData.picture = imageBase64;
        }

        connection.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ message: 'Transaction start error', error: err });
            }

            connection.query('UPDATE products SET ?,updated_at = CURRENT_TIMESTAMP  WHERE pd_id = ?', [productUpdateData, pd_id], (err, productResult) => {
                if (err) {
                    console.error('Error updating product:', err);
                    connection.rollback(() => {
                        res.status(500).json({ message: 'Error updating product', error: err });
                    });
                    return;
                }

                if (!productResult || productResult.affectedRows === 0) {
                    console.error('Product update result is invalid:', productResult);
                    connection.rollback(() => {
                        res.status(500).json({ message: 'Invalid product update result' });
                    });
                    return;
                }
                //มีปัญหา
                console.log(recipe, recipedetail)
                if (recipe && recipedetail) {

                    // const recipeUpdateData = { };

                    connection.query('UPDATE recipe SET ? WHERE pd_id = ?', [recipe, pd_id], (err, recipeResult) => {
                        if (err) {
                            console.error('Error updating product:', err);
                            connection.rollback(() => {
                                res.status(500).json({ message: 'Error updating recipe', error: err });
                            });
                            return;
                        }


                        // Check if there are recipedetails to process
                        if (recipedetail && recipedetail.length > 0) {

                            const indIdsInReq = recipedetail.map(detail => detail.ind_id).filter(id => id !== undefined);
                            console.log("req", indIdsInReq)
                            // Fetch existing ind_ids from the database for the current recipe
                            const existingIndIdsQuery = `SELECT rd.ind_id, rd.rc_id
                        FROM recipedetail rd 
                        JOIN recipe r ON rd.rc_id = r.rc_id 
                        JOIN products p ON p.pd_id = r.pd_id 
                        where p.pd_id = ?`;
                            connection.query(existingIndIdsQuery, pd_id, (err, existingIndIds) => {
                                if (err) {
                                    connection.rollback(() => {
                                        return res.status(500).json({ message: 'Error fetching existing ind_ids', error: err });
                                    });
                                }


                                // const rcIdsArray = existingIndIds.map(row => row.rc_id);
                                // console.log("rcIdsArray", rcIdsArray);
                                const rcId = existingIndIds.reduce((acc, current) => current.rc_id, null);
                                console.log("rcId", rcId);

                                const existingIndIdsArray = existingIndIds.map(row => row.ind_id);
                                console.log("DB", existingIndIdsArray)
                                const indIdsToUpdate = existingIndIdsArray.filter(id => indIdsInReq.includes(id));
                                const indIdsToAdd = indIdsInReq.filter(id => !existingIndIdsArray.includes(id));
                                const indIdsToDelete = existingIndIdsArray.filter(id => !indIdsInReq.includes(id));
                                console.log("up", indIdsToUpdate, "add", indIdsToAdd, "de", indIdsToDelete)

                                const updateData = [];
                                const insertData = [];
                                // const deleteData = [];

                                recipedetail.forEach(detail => {
                                    const { ind_id, ingredients_qty, un_id } = detail;
                            
                                    // Check if ind_id is defined and not null
                                    if (ind_id !== undefined && ind_id !== null) {
                                        if (indIdsToUpdate.includes(ind_id)){
                                            updateData.push(detail);
                                            console.log("updateData",updateData)
                                        }
                                        if (indIdsToAdd.includes(ind_id)){
                                            insertData.push(detail);
                                            console.log("insertData",insertData)
                                        }
                                        // if (indIdsToDelete.includes(ind_id)){
                                        //     deleteData.push(detail);
                                        //     console.log("deleteData",deleteData)
                                        // }
                                    }
                                });
                            


                                // Update recipedetail records
                                if (updateData.length > 0) {
                                    // const updateQuery = `UPDATE recipedetail SET ?, deleted_at = NULL WHERE rc_id = ? AND ind_id IN (?)`;
                                    // // Construct your update query and execute it
                                    // connection.query(updateQuery, [recipedetail,rcIdsArray ,indIdsToUpdate], (err, updateResult) => {
                                    //     if (err) {
                                    //         connection.rollback(() => {
                                    //             return res.status(500).json({ message: 'Error updating recipedetail', error: err });
                                    //         });
                                    //     }
                                    // });
                                    // Update recipedetail records for each detail

                                    updateData.forEach(detail => {
                                        console.log("updateDatade",detail)
                                    const { ind_id, ingredients_qty, un_id } = detail;
                                    const updateQuery = `UPDATE recipedetail SET ingredients_qty = ?, un_id = ?, deleted_at = NULL WHERE rc_id = ? AND ind_id = ?`;
                                    // Execute the update query for each detail
                                    connection.query(updateQuery, [ingredients_qty, un_id, rcId, ind_id], (err, updateResult) => {
                                        if (err) {
                                            connection.rollback(() => {
                                                return res.status(500).json({ message: 'Error updating recipedetail', error: err });
                                            });
                                        }
                                    });
                                    });

                                }


                                // // Insert new recipedetail records
                                // if (insertData.length > 0) {
                                //     insertData.forEach(detail => {
                                //         const insertQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id) VALUES ?`;
                                //         const valuesToAdd = detail.map(id => [rcId, id, ingredients_qty, un_id]); // แก้ไขตรงนี้
                                //         // Insert new records into recipedetail table
                                //         connection.query(insertQuery, [valuesToAdd], (err, insertResult) => {
                                //             if (err) {
                                //                 connection.rollback(() => {
                                //                     return res.status(500).json({ message: 'Error inserting new recipedetail records', error: err });
                                //                 });
                                //             }
                                //         });
                                //     });
                                // }
                                if (insertData.length > 0) {
            
                                    const insertQuery = "INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id,deleted_at) VALUES (?,?,?,?,?)";
                        
                                    const flattenedineData = insertData.flat();
                        
                                    flattenedineData.forEach(detail => {
                                        const insertValues = [
                                            rcId,
                                            detail.ind_id,
                                            detail.ingredients_qty,
                                            detail.un_id,
                                            null // กำหนดให้ deleted_at เป็น null
                                        ];
                        
                                        connection.query(insertQuery, insertValues, (err, results) => {
                                            if (err) {
                                                connection.rollback(() => {
                                                    return res.status(500).json({ message: 'Error soft insertQuery recipedetail records', error: err });
                                                });
                                            }
                                        });
                                    });
                                }
                        
                        
                                

                                // // Soft delete recipedetail records
                                if (indIdsToDelete.length > 0) {
                                    indIdsToDelete.forEach(detail => {
                                    const softDeleteQuery = `UPDATE recipedetail SET deleted_at = CURRENT_TIMESTAMP WHERE rc_id = ? AND ind_id IN (?)`;
                                    // Soft delete existing records in recipedetail table
                                    connection.query(softDeleteQuery, [rcId, detail], (err, deleteResult) => {
                                        if (err) {
                                            connection.rollback(() => {
                                                return res.status(500).json({ message: 'Error soft deleting recipedetail records', error: err });
                                            });
                                        }
                                    });
                                });
                                }
                            });

                        }

                    });
                }

                // ยืนยันธุรกรรม
                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            return res.status(500).json({ message: 'Transaction commit error', error: err });
                        });
                    }

                    return res.json({
                        productId: pd_id,
                        message: 'Product updated successfully!',
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error resizing image:', error);
        return res.status(500).json({ message: 'Error resizing image', error });
    }
});

//test new no recipe
// Import the fs module for file system operations
// const fs = require('fs');

// router.post('/addProductWithRecipe', upload.single('picture'), async (req, res) => {
//     const { pd_name, pd_qtyminimum, status, pdc_id } = req.body;
//     const imageBuffer = req.file && req.file.buffer ? req.file.buffer : null;

//     if (!imageBuffer) {
//         return res.status(400).json({ message: 'No image file provided' });
//     }

//     try {
//         const resizedImageBuffer = await sharp(imageBuffer)
//             .resize({ width: 300, height: 300 })
//             .toBuffer();

//         // Check if the picture field exists and has a valid value
//         if (!req.body.product.picture) {
//             console.error('Error: Filename is missing');
//             return res.status(400).json({ message: 'Filename is missing' });
//         }

//         // Generate a unique filename for the image
//         const filename = req.body.product.picture;

//         // Write the resized image buffer to the file system
//         fs.writeFileSync(`path/to/your/uploads/${filename}`, resizedImageBuffer);

//         // Store the filename (or full path) in the database
//         const product = { pd_name, pd_qtyminimum, status, pdc_id, picture: filename }; // Adjust 'picture' to store the filename

//         // Continue with your database insertion logic...
//     } catch (error) {
//         console.error('Error resizing image:', error);
//         return res.status(500).json({ message: 'Error resizing image', error });
//     }
// });


//ลองค้นหา
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













// module.exports = { upload, router };
module.exports = router;