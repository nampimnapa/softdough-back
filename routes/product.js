
//เพิ่มapi สำหรับหน่วย มีประเภทหน่วย
const express = require("express");
const connection = require("../connection");

const multer = require('multer');
const router = express.Router();
const upload = multer();

const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder ,isAdminUserOrder} = require('../middleware')



router.post('/addcat', async (req, res, next) => {
    const { pdc_name } = req.body;

    if (!pdc_name || pdc_name.trim() === '') {
        return res.status(400).json({ message: "Category name is required" });
    }

    const query = "INSERT INTO productcategory (pdc_name) VALUES (?)";

    try {
        const [result] = await connection.promise().query(query, [pdc_name]);
        
        return res.status(201).json({ 
            message: "Category added successfully", 
            categoryId: result.insertId 
        });
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while adding the category", 
            error: error.message 
        });
    }
});

router.get('/readcat', async (req, res, next) => {
    const query = 'SELECT * FROM productcategory';

    try {
        const [results] = await connection.promise().query(query);
        return res.status(200).json(results);
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while fetching product categories", 
            error: error.message 
        });
    }
});


router.patch('/updatecat/:pdc_id', async (req, res, next) => {
    const pdc_id = req.params.pdc_id;
    const { pdc_name } = req.body;

    const query = "UPDATE productcategory SET pdc_name = ? WHERE pdc_id = ?";

    try {
        const [results] = await connection.promise().query(query, [pdc_name, pdc_id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        return res.status(200).json({ message: "Category updated successfully" });
    } catch (error) {
        console.error("Database Query Error:", error);
        return res.status(500).json({ 
            message: "An error occurred while updating the category", 
            error: error.message 
        });
    }
});


const sharp = require('sharp');


// น้ำลองเอาโค้ดเก่ามาแปะ
router.post('/addProductWithRecipe', async (req, res) => {
    const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail, picture } = req.body;

    const productWithPicture = { pd_name, pd_qtyminimum, status, pdc_id, picture };

    const conn = await connection.promise().getConnection();

    try {
        await conn.beginTransaction();

        // Insert product
        const [productResult] = await conn.query('INSERT INTO products SET ?', productWithPicture);
        
        if (!productResult || !productResult.insertId) {
            throw new Error('Invalid product insertion result');
        }

        const productId = productResult.insertId;

        // If recipe and recipedetail exist, insert them
        if (recipe && recipedetail) {
            // Insert recipe
            const [recipeResult] = await conn.query('INSERT INTO recipe SET ?', { ...recipe, pd_id: productId });
            const recipeId = recipeResult.insertId;

            // Insert recipe details
            const values = recipedetail.map(detail => [
                recipeId, 
                detail.ind_id, 
                detail.ingredients_qty, 
                detail.un_id,
                null // deleted_at
            ]);
            const recipeDetailQuery = `INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id, deleted_at) VALUES ?`;
            await conn.query(recipeDetailQuery, [values]);

            await conn.commit();

            res.json({
                productId,
                recipeId,
                message: 'Product and recipe added successfully!',
                status: 200
            });
        } else {
            // Only product was added
            await conn.commit();

            res.json({
                productId,
                message: 'Product added successfully!',
                status: 200
            });
        }
    } catch (error) {
        await conn.rollback();
        console.error('Error in addProductWithRecipe:', error);
        res.status(500).json({ 
            message: 'An error occurred while adding the product and recipe', 
            error: error.message 
        });
    } finally {
        conn.release();
    }
});

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
                product.picture = `${product.picture}`;
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

    if (isNaN(pd_id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
        const query = `
            SELECT pd.*, rc.*, u.un_name as un_name, rcd.*, ind.ind_name as ind_name, pdc.pdc_name as pdc_name
            FROM productcategory pdc
            JOIN products pd ON pdc.pdc_id = pd.pdc_id
            JOIN recipe rc ON rc.pd_id = pd.pd_id
            JOIN recipedetail rcd ON rcd.rc_id = rc.rc_id
            JOIN ingredient ind ON ind.ind_id = rcd.ind_id
            JOIN unit u ON rc.un_id = u.un_id
            WHERE pd.pd_id = ?
        `;

        const [results] = await connection.promise().query(query, [pd_id]);

        const filteredResults = results.filter(item => item.deleted_at === null);

        if (filteredResults.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const formattedResult = {
            pd_id: filteredResults[0].pd_id,
            pd_name: filteredResults[0].pd_name,
            pd_qtyminimum: filteredResults[0].pd_qtyminimum,
            pdc_name: filteredResults[0].pdc_name,
            status: filteredResults[0].status,
            picture: filteredResults[0].picture,
            created_at: filteredResults[0].created_at,
            updated_at: filteredResults[0].updated_at,
            rc_id: filteredResults[0].rc_id,
            un_name: filteredResults[0].un_name,
            qtylifetime: filteredResults[0].qtylifetime,
            produced_qty: filteredResults[0].produced_qty,
            recipedetail: filteredResults.map(item => ({
                ingredients_qty: item.ingredients_qty,
                ind_id: item.ind_id,
                un_id: item.un_id,
                ind_name: item.ind_name
            }))
        };

        return res.status(200).json(formattedResult);
    } catch (error) {
        console.error('Error retrieving product:', error);
        return res.status(500).json({ 
            message: 'An error occurred while retrieving the product', 
            error: error.message 
        });
    }
});

router.get('/productsall', async (req, res, next) => {
    try {
        const query = `
            SELECT pd.*, rc.* 
            FROM products pd 
            JOIN recipe rc ON rc.pd_id = pd.pd_id
        `;

        const [results] = await connection.promise().query(query);

        // ปรับแต่ง URL ของรูปภาพ (ถ้าจำเป็น)
        const productsWithAdjustedPictures = results.map(result => ({
            ...result,
            picture: result.picture ? `${result.picture}` : null
        }));

        return res.status(200).json(productsWithAdjustedPictures);
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({ 
            message: 'An error occurred while retrieving products', 
            error: error.message 
        });
    }
});

// แก้ไข ยังไม่ลอง
//เปลี่ยนจาก หรือ เป็นเช็คทีละอัน ไม่สมประกอบในส่วน ดีเทล รีซีบไม่มี 
//กรณีแก้อันเดียว หรือไม่แก้ทั้งหมด
//เงื่อนไข ยังมีปัญหากรณีทั้งแอด ลบ อัปเดต ใน req เดียว
// ได้แยะ
router.patch('/editProductWithRecipe/:pd_id',  async (req, res) => {
    const pd_id = req.params.pd_id;
    const { pd_name, pd_qtyminimum, status, pdc_id, recipe, recipedetail, picture } = req.body;

    const conn = await connection.promise().getConnection();

    try {
        await conn.beginTransaction();

        const productUpdateData = { pd_name, pd_qtyminimum, status, pdc_id, picture };

        // Update product
        const [productResult] = await conn.query(
            'UPDATE products SET ?, updated_at = CURRENT_TIMESTAMP WHERE pd_id = ?',
            [productUpdateData, pd_id]
        );

        if (productResult.affectedRows === 0) {
            throw new Error('Product not found or no changes made');
        }

        if (recipe && recipedetail) {
            // Update recipe
            await conn.query('UPDATE recipe SET ? WHERE pd_id = ?', [recipe, pd_id]);

            // Get existing recipe details
            const [existingIndIds] = await conn.query(
                `SELECT rd.ind_id, rd.rc_id
                 FROM recipedetail rd 
                 JOIN recipe r ON rd.rc_id = r.rc_id 
                 JOIN products p ON p.pd_id = r.pd_id 
                 WHERE p.pd_id = ?`,
                [pd_id]
            );

            const rcId = existingIndIds[0]?.rc_id;
            const existingIndIdsArray = existingIndIds.map(row => row.ind_id);
            const indIdsInReq = recipedetail.map(detail => detail.ind_id).filter(id => id !== undefined);

            const indIdsToUpdate = existingIndIdsArray.filter(id => indIdsInReq.includes(id));
            const indIdsToAdd = indIdsInReq.filter(id => !existingIndIdsArray.includes(id));
            const indIdsToDelete = existingIndIdsArray.filter(id => !indIdsInReq.includes(id));

            // Update existing recipe details
            for (const detail of recipedetail.filter(d => indIdsToUpdate.includes(d.ind_id))) {
                await conn.query(
                    `UPDATE recipedetail SET ingredients_qty = ?, un_id = ?, deleted_at = NULL 
                     WHERE rc_id = ? AND ind_id = ?`,
                    [detail.ingredients_qty, detail.un_id, rcId, detail.ind_id]
                );
            }

            // Insert new recipe details
            if (indIdsToAdd.length > 0) {
                const insertQuery = "INSERT INTO recipedetail (rc_id, ind_id, ingredients_qty, un_id, deleted_at) VALUES ?";
                const values = recipedetail
                    .filter(d => indIdsToAdd.includes(d.ind_id))
                    .map(d => [rcId, d.ind_id, d.ingredients_qty, d.un_id, null]);
                await conn.query(insertQuery, [values]);
            }

            // Soft delete recipe details
            if (indIdsToDelete.length > 0) {
                await conn.query(
                    `UPDATE recipedetail SET deleted_at = CURRENT_TIMESTAMP 
                     WHERE rc_id = ? AND ind_id IN (?)`,
                    [rcId, indIdsToDelete]
                );
            }
        }

        await conn.commit();
        res.status(200).json({
            productId: pd_id,
            message: 'Product updated successfully!'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error updating product:', error);
        res.status(500).json({ 
            message: 'An error occurred while updating the product', 
            error: error.message 
        });
    } finally {
        conn.release();
    }
});


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

  
// คำนวณหาสต็อกวัตถุดิบขั้นต่ำ
//เอา sql มาแปะไว้ก่อน
router.get('/productmini', async (req, res) => {
    const sql = `  SELECT 
                      p.pd_name, 
                      odsm.qty AS order_qty,
                      pod.qty AS promo_qty, -- สมมติว่าตาราง promotionOrderDetail มีคอลัมน์ปริมาณ (ปรับตามความเหมาะสม)
                      o.od_date
                  FROM 
                      orderdetailsalesmenu odsm
                  JOIN 
                      orderdetail od ON odsm.odde_id = od.odde_id
                  JOIN 
                      "order" o ON od.od_id = o.od_id
                  JOIN 
                      products p ON p.pd_id = odsm.pdod_id -- สมมติว่า pdod_id ใน orderdetailSalesMenu เชื่อมโยงกับ pd_id ใน product
                  LEFT JOIN 
                      promotionorderdetail pod ON pod.pdod_id = odsm.pdod_id -- เชื่อมโยง promotionOrderDetail เพื่อดึงข้อมูลโปรโมชั่น
                  WHERE 
                      o.od_date >= CURDATE() - INTERVAL 14 DAY;
  `;
    
    try {
      // Use parameterized queries to prevent SQL injection
      connection.query(sql, [], (err, result) => {
        if (err) {
          console.error('Error executing query:', err);
          res.status(500).send('Internal server error');
          return;
        }
        res.json(result);
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
    }
  });
  
  











// module.exports = { upload, router };
module.exports = router;