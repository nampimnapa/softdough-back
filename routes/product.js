
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
//ขั้นต่ำ
router.get('/productmini', async (req, res) => {
    const sql =
        `
      SELECT * FROM (
        -- First Query for ingredient_used_pro
        SELECT 
            odsm.qty as qtyusesum,  -- Select specific columns instead of indp.*
            pd.pd_name,           
            pd.pd_id,
            odsm.odde_sm_id  as id,
            DATE_FORMAT(o.od_date, '%Y-%m-%d') as date,
            'สินค้าหลัก' AS name  -- Static value for 'name'
        
        FROM 
            orderdetailsalesmenu odsm
        JOIN 
            orderdetail od ON odsm.odde_id = od.odde_id
        JOIN          
            \`order\` o ON o.od_id = od.od_id 
        JOIN          
            productionorderdetail pdod ON pdod.pdod_id = odsm.pdod_id 
        JOIN          
            products pd ON pdod.pd_id = pd.pd_id 
        WHERE 
        o.od_date >= CURDATE() - INTERVAL 14 DAY
        AND o.od_status = 1
        
        UNION ALL
        
        -- Second Query for ingredient_used_detail
        SELECT 
            pmod.qty as qtyusesum,
            pd.pd_name,
            pd.pd_id,
            pmod.pmod_id as id,
            DATE_FORMAT(o.od_date, '%Y-%m-%d') as date,
            'ของแถม' AS name  -- Static value for 'name'
        FROM 
            promotionorderdetail pmod
        JOIN 
            orderdetail od ON pmod.odde_id = od.odde_id
        JOIN          
            \`order\` o ON o.od_id = od.od_id 
        JOIN          
            productionorderdetail pdod ON pdod.pdod_id = pmod.pdod_id 
        JOIN          
            products pd ON pdod.pd_id = pd.pd_id 
        WHERE 
            o.od_date >= CURDATE() - INTERVAL 14 DAY
        AND o.od_status = 1
    ) AS combined_results
    ORDER BY date DESC;
    
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
                const pdName = item.pd_name;
                const qty = item.qtyusesum || 0;
                const pdId = item.pd_id;
            
                // Find if there's already a group for this pd_name
                const existingGroup = acc.find(group => group.pdName === pdName);
                if (existingGroup) {
                    // If group exists, add item to detail and update sumqty
                    existingGroup.detail.push(item);
                    existingGroup.sumqty += qty;
            
                    // Create or update a map that sums qtyusesum per day
                    if (existingGroup.dailyTotals[item.date]) {
                        existingGroup.dailyTotals[item.date] += qty; // Add to existing date
                    } else {
                        existingGroup.dailyTotals[item.date] = qty; // New date entry
                    }
            
                    // Update sumday only if the date is unique
                    if (!existingGroup.uniqueDates.has(item.date)) {
                        existingGroup.uniqueDates.add(item.date);
                        existingGroup.sumday += 1;
                    }
                } else {
                    // If group doesn't exist, create a new group
                    const uniqueDates = new Set([item.date]);
                    acc.push({
                        pdId: pdId,
                        pdName: pdName,
                        sumqty: qty,
                        sumday: 1,  // Initialize sumday with 1 for the first date
                        detail: [item],
                        uniqueDates: uniqueDates,
                        dailyTotals: { [item.date]: qty } // Initialize dailyTotals map
                    });
                }
            
                return acc;
            }, [])
            .map(group => {
                // Calculate the maximum quantity sold on any single day
                const dailyTotalsArray = Object.values(group.dailyTotals); // Get the daily totals as an array
                console.log(dailyTotalsArray, 'dailyTotals')
                const maxQty = Math.max(...dailyTotalsArray); // Find the max of daily totals
            
                // Calculate the average and other metrics after grouping
                const average = group.sumqty / group.sumday || 0; // Ensure average has a default value (0)
            
                // Safety Stock calculation
                const SafetyStock = (maxQty * 1) - (average * 1);
            
                // Ensure SafetyStock is not NaN or null by checking if average and maxQty are valid
                const validSafetyStock = isNaN(SafetyStock) ? 0 : SafetyStock;
            
                delete group.uniqueDates;
                delete group.dailyTotals;
            
                return {
                    ...group,
                    average: average || 0,
                    maxQty: maxQty, // Add maxQty to the final output
                    SafetyStock: validSafetyStock  // Use the validSafetyStock to avoid null values
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













// module.exports = { upload, router };
module.exports = router;