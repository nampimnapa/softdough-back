// const express = require('express');
// const connection = require("../connection");
// const router = express.Router();
// const { Updateqtystock } = require('../routes/ingredient');


// const util = require('util');

// // Promisify the query method
// const queryAsync = util.promisify(connection.query).bind(connection);

// //ไม่มีแอดลง notication
// // const checkMinimumIngredient = async () => {
// //     try {
// //         const query = `
// //             SELECT 
// //                 ingredient.ind_id,
// //                 ingredient.ind_name,
// //                 ingredient.ind_stock,
// //                 ingredient.status,
// //                 ingredient.qtyminimum
// //             FROM 
// //                 ingredient 

// //             HAVING 
// //             ingredient.ind_stock <= ingredient.qtyminimum
// //         `;

// //         // Execute the query using the promisified method
// //         const results = await queryAsync(query);

// //         // Debugging: Log the results to check their structure
// //         console.log('Query Results:', results);

// //         // Ensure results is an array
// //         if (Array.isArray(results)) {
// //             if (results.length > 0) {
// //                 console.log('Ingredients with low stock:', results);
// //                 return results;
// //             } else {
// //                 console.log('No ingredients below the minimum stock level.');
// //                 return [];
// //             }
// //         } else {
// //             console.error('Query returned results that are not an array.');
// //             return [];
// //         }
// //     } catch (error) {
// //         console.error('MySQL Error:', error);
// //         return []; // Return an empty array in case of error
// //     }
// // };

// //แอดลง notifications
// // const checkMinimumIngredient = async () => {
// //     try {
// //         console.log('Checking minimum');
// //         const query = `
// //             SELECT 
// //                 ingredient.ind_id,
// //                 ingredient.ind_name,
// //                 ingredient.ind_stock,
// //                 ingredient.status,
// //                 ingredient.qtyminimum
// //             FROM 
// //                 ingredient 
// //             HAVING 
// //                 ingredient.ind_stock <= ingredient.qtyminimum
// //         `;

// //         // Execute the query using the promisified method
// //         const ingredients = await queryAsync(query);

// //         if (Array.isArray(ingredients) && ingredients.length > 0) {
// //             console.log('Ingredients with low stock:', ingredients);

// //             // ดึงข้อมูลพนักงานทั้งหมด
// //             const querystaff = `
// //                 SELECT 
// //                     st_id
// //                 FROM 
// //                     staff
// //                 where st_type = 0 or st_type = 1
// //             `;
// //             const staffResults = await queryAsync(querystaff);

// //             // ดึง user_id ทั้งหมดในตาราง staff มาเก็บในรูปแบบของสตริง เช่น "1,2,3"
// //             const userIds = staffResults.map(staff => staff.st_id).join(',');

// //             // ลูปเพิ่มข้อมูลแจ้งเตือนลงใน notification
// //             for (let ingredient of ingredients) {
// //                 const insertQuery = `
// //                     INSERT INTO notification (pd_id, ind_id, user_id, type) 
// //                     VALUES (?, ?, ?, ?)
// //                 `;
// //                 const values = [
// //                     null, // pd_id (ในที่นี้กำหนดเป็น 0 แต่คุณสามารถปรับได้ตามต้องการ)
// //                     ingredient.ind_id, // ind_id ของวัตถุดิบที่แจ้งเตือน
// //                     userIds, // user_id ในรูปแบบสตริง "1,2"
// //                     'I' // type (ตัวอย่างนี้กำหนดเป็น 'I' สำหรับ ingredient)
// //                 ];

// //                 // เพิ่มข้อมูลแจ้งเตือนลงในฐานข้อมูล
// //                 await queryAsync(insertQuery, values);
// //             }

// //             return ingredients; // ส่งคืนรายการวัตถุดิบที่สต๊อกใกล้หมด
// //         } else {
// //             console.log('No ingredients below the minimum stock level.');
// //             return [];
// //         }
// //     } catch (error) {
// //         console.error('MySQL Error:', error);
// //         return [];
// //     }
// // };
// const http = require('http');
// const server = http.createServer(express);
// const socketIo = require('socket.io');

// const io = socketIo(server, {
//     cors: {
//         origin: 'http://localhost:3000',
//         methods: ['GET', 'POST'],
//         allowedHeaders: ['Content-Type'],
//         credentials: true
//     }
// });

// //ใช้กับวัตถุดิบที่ใช้กับอื่นๆ ยังไม่ได้ เป็นงงๆสต็อกไม่หักก่อนจะเอามาอ่าน แล้วเดี๋ยได้เดี๋ยวไม่ได้
// const checkMinimumIngredient = async () => {
//     try {
//         // Updateqtystock()
//         // const { Updateqtystock } = require('../routes/notification');
//         // Updateqtystock();
//         console.log('Checking minimum');
//         const query = `
//         SELECT 
//         ingredient.ind_id,
//         ingredient.ind_name,
//         ingredient.ind_stock,
//         ingredient.status,
//         ingredient.qtyminimum
//     FROM 
//         ingredient 
//     HAVING 
//         ROUND(CAST(ingredient.ind_stock AS DECIMAL), 2) <= ROUND(CAST(ingredient.qtyminimum AS DECIMAL), 2)

//         `;

//         const ingredients = await queryAsync(query);
//         console.log(ingredients,'ingredients')
//         if (Array.isArray(ingredients) && ingredients.length > 0) {
//             console.log('Ingredients with low stock:', ingredients);

//             const querystaff = `
//                 SELECT 
//                     st_id
//                 FROM 
//                     staff
//                 WHERE st_type = 0 OR st_type = 1
//             `;
//             const staffResults = await queryAsync(querystaff);

//             const userIds = staffResults.map(staff => staff.st_id).join(',');

//             for (let ingredient of ingredients) {
//                 const insertQuery = `
//                     INSERT INTO notification (pd_id, ind_id, user_id, type) 
//                     VALUES (?, ?, ?, ?)
//                 `;
//                 const values = [
//                     null, // pd_id
//                     ingredient.ind_id,
//                     userIds,
//                     'I'
//                 ];

//                 await queryAsync(insertQuery, values);
//             }

//             if (Array.isArray(ingredients) && ingredients.length > 0) {
//                 console.log('Sending low stock notification:', ingredients); // ตรวจสอบว่าวัตถุดิบต่ำกว่าเกณฑ์
//                 io.emit('lowStockNotification', ingredients); // ส่งการแจ้งเตือน
//             }
//             return ingredients;
//         } else {
//             console.log('No ingredients below the minimum stock level.');
//             return [];
//         }
//     } catch (error) {
//         console.error('MySQL Error:', error);
//         return [];
//     }
// };


// // API for fetching unread notifications
// // router.get('/unread', async (req, res) => {
// //     // const { userId } = req.query;
// //     const userId = req.session.st_id; // ดึง user_id จาก session

// //     try {
// //       const query = `
// //         SELECT notification.*, ingredient.ind_name, ingredient.ind_stock, ingredient.qtyminimum
// //         FROM notification
// //         JOIN ingredient ON notification.ind_id = ingredient.ind_id
// //         WHERE FIND_IN_SET(?, notification.user_id)
// //         AND (notification.read_id IS NULL OR NOT FIND_IN_SET(?, notification.read_id))
// //       `;
// //       const results = await queryAsync(query, [userId, userId]);

// //       console.log(results);
// //       res.json(results);
// //     } catch (error) {
// //       console.error('Error fetching unread notifications:', error);
// //       res.status(500).json({ message: 'Error fetching notifications' });
// //     }
// // });



// // API for marking notifications as read
// router.post('/markAsRead', async (req, res) => {
//     const  noti_id  = req.body;

//     const userId = req.session.st_id; // ดึง user_id จาก session

//     try {
//         const query = `SELECT read_id FROM notification WHERE noti_id = ?`;
//         const result = await queryAsync(query, [noti_id]);

//         let readId = result[0].read_id || ''; 

//         if (!readId.includes(userId)) {
//             readId = readId ? `${readId},${userId}` : `${userId}`;

//             const updateQuery = `UPDATE notification SET read_id = ? WHERE noti_id = ?`;
//             await queryAsync(updateQuery, [readId, noti_id]);
//         }

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Error marking notification as read:', error);
//         res.status(500).json({ message: 'Error marking notification as read' });
//     }
// });


// // module.exports = router; // แค่ router เท่านั้น
// // module.exports = { checkMinimumIngredient };
// module.exports = {
//     router,
//     checkMinimumIngredient
// };
// // module.exports.checkMinimumIngredient = checkMinimumIngredient;
const express = require('express');
const connection = require("../connection");
const router = express.Router();
const util = require('util');

// Promisify the query method
const queryAsync = util.promisify(connection.query).bind(connection);

// async function checkAndAddNotifications() {
//     try {
//         // Query to get ingredients where stock is below or equal to minimum required quantity
//         const ingredientQuery = `
//         SELECT 
//           ingredient.ind_id,
//           ingredient.ind_name,
//           ingredient.ind_stock,
//           ingredient.qtyminimum
//         FROM ingredient 
//         HAVING 
//           ROUND(CAST(ingredient.ind_stock AS DECIMAL), 2) <= ROUND(CAST(ingredient.qtyminimum AS DECIMAL), 2)
//       `;
//         const [ingredients] = await connection.query(ingredientQuery);

//         // If no ingredients match the condition, exit
//         if (ingredients.length === 0) {
//             console.log('No low stock ingredients found');
//             return;
//         }

//         // Get all staff members with st_type = 0 or 1
//         const staffQuery = `
//         SELECT st_id 
//         FROM staff 
//         WHERE st_type = 0 OR st_type = 1
//       `;
//         const [staff] = await connection.query(staffQuery);

//         // Create a list of user IDs (st_id values)
//         const userIds = staff.map(staffMember => staffMember.st_id).join(',');

//         // For each ingredient with low stock, insert a new notification
//         for (const ingredient of ingredients) {
//             const notificationQuery = `
//           INSERT INTO notification (ind_id, user_id, type)
//           VALUES (?, ?, 'I')
//         `;
//             await connection.query(notificationQuery, [ingredient.ind_id, userIds]);

//             // Optionally, send real-time notifications to users via socket.io
//             const newNotification = {
//                 ind_id: ingredient.ind_id,
//                 ind_name: ingredient.ind_name,
//                 user_id: userIds,
//                 type: 'I' // Assuming 'I' stands for ingredient notification
//             };

//             const userList = userIds.split(',');
//             userList.forEach((user) => {
//                 io.to(user).emit('newNotification', newNotification);
//             });
//         }
//         console.log('Notifications added for low stock ingredients');
//     } catch (error) {
//         console.error('Error checking and adding notifications:', error);
//     }
// }


// const socketIo = require('socket.io');
// const http = require('http');
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//     cors: {
//         origin: 'http://localhost:3000',
//         credentials: true
//     }
// });
// const { io } = require('../socket'); // หรือใช้วิธีการที่คุณตั้งค่า io

// const setupSocket = require('../socket'); // เรียกใช้ไฟล์ socket.js
// const http = require('http');
// const app = express();
// const server = http.createServer(app);

// const io = setupSocket(server); // ตั้งค่า Socket.IO และเก็บค่า io
// const io = req.app.locals.io;

//ส่งทุก socketที่เชื่อมต่อ
// async function checkAndAddNotifications(io) {
//     try {
//         console.log('ใช้ io ใน checkAndAddNotifications:', io);
//         // First query to get total stock of ingredients
//         const query = `
//         SELECT 
//             ingredient.ind_id,
//             SUM(ingredient_lot_detail.qty_stock) AS total_stock,
//             ingredient.ind_name,
//             (SUM(ingredient_lot_detail.qty_stock) DIV ingredient.qty_per_unit) AS ind_stock,
//             unit1.un_name AS un_purchased_name,
//             unit2.un_name AS un_ind_name,
//             ingredient.status,
//             ingredient.qtyminimum
//         FROM 
//             ingredient 
//         LEFT JOIN 
//             unit AS unit1 ON ingredient.un_purchased = unit1.un_id
//         LEFT JOIN 
//             unit AS unit2 ON ingredient.un_ind = unit2.un_id
//         LEFT JOIN 
//             ingredient_lot_detail ON ingredient.ind_id = ingredient_lot_detail.ind_id
//         LEFT JOIN 
//             ingredient_lot ON ingredient_lot_detail.indl_id = ingredient_lot.indl_id
//         WHERE  
//             ingredient_lot.status = 2
//         AND 
//             ingredient_lot_detail.deleted_at IS NULL
//         AND
//             ingredient_lot_detail.date_exp > NOW()
//         GROUP BY 
//             ingredient_lot_detail.ind_id
//         `;

//         const [results] = await connection.promise().query(query);
//         console.log('results', results);

//         // Second query for low stock ingredients
//         const ingredientQuery = `
//           SELECT 
//             ingredient.ind_id,
//             ingredient.ind_name,
//             (SUM(ingredient_lot_detail.qty_stock) DIV ingredient.qty_per_unit) AS ind_stock,
//             ingredient.qtyminimum
//           FROM ingredient 
//           LEFT JOIN ingredient_lot_detail ON ingredient.ind_id = ingredient_lot_detail.ind_id
//           LEFT JOIN ingredient_lot ON ingredient_lot_detail.indl_id = ingredient_lot.indl_id
//           WHERE ingredient_lot.status = 2
//           AND ingredient_lot_detail.deleted_at IS NULL
//           AND ingredient_lot_detail.date_exp > NOW()
//           GROUP BY ingredient.ind_id
//           HAVING ind_stock <= ingredient.qtyminimum
//         `;

//         const [ingredients] = await connection.promise().query(ingredientQuery);

//         if (ingredients.length === 0) {
//             console.log('No low stock ingredients found');
//             return; // Exit if no low stock ingredients found
//         }

//         console.log('Low stock ingredients:', ingredients);

//         // Query to get the staff members (for notifications)
//         const staffQuery = `
//           SELECT st_id 
//           FROM staff 
//           WHERE st_type = 0 OR st_type = 1
//         `;

//         const [staff] = await connection.promise().query(staffQuery);

//         if (staff.length === 0) {
//             console.log('No staff found for notifications');
//             return;
//         }

//         const notificationPromises = ingredients.map(async (ingredient) => {
//             const staffNotificationPromises = staff.map(async (staffMember) => {
//                 const notificationQuery = `
//                     INSERT INTO notification (ind_id, user_id, type)
//                     VALUES (?, ?, 'I')
//                 `;
//                 await connection.promise().query(notificationQuery, [ingredient.ind_id, staffMember.st_id]);

//                 // Send notification to the correct socket room
//                 // io.to(staffMember.st_id).emit('lowStockNotification', {
//                 //     ind_id: ingredient.ind_id,
//                 //     ind_name: ingredient.ind_name,
//                 //     type: 'I',
//                 // });
//                 io.emit('lowStockNotification', {
//                     ind_id: ingredient.ind_id,
//                     ind_name: ingredient.ind_name,
//                     type: 'I',
//                 });


//                 console.log(`Notification sent to user ${staffMember.st_id}:`, {
//                     ind_id: ingredient.ind_id,
//                     ind_name: ingredient.ind_name,
//                     type: 'I'
//                 });

//                 // const connectedSockets = Object.keys(io.sockets.sockets);
//                 // console.log('Connected sockets:', connectedSockets);
//             });

//             return Promise.all(staffNotificationPromises);
//         });


//         await Promise.all(notificationPromises);




//         console.log('Notifications added for low stock ingredients');
//     } catch (error) {
//         console.error('Error checking and adding notifications:', error);
//     }
// }

//ส่งตาม user
//ได้แล้วแต่ยังไม่ลองหลายวัตถุดิบหลาย user TT
async function checkAndAddNotifications(io) {
    try {
        console.log('ใช้ io ใน checkAndAddNotifications:', io);
        // First query to get total stock of ingredients
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
        AND
            ingredient_lot_detail.date_exp > NOW()
        GROUP BY 
            ingredient_lot_detail.ind_id
        `;

        const [results] = await connection.promise().query(query);
        console.log('results', results);

        // Second query for low stock ingredients
        const ingredientQuery = `
          SELECT 
            ingredient.ind_id,
            ingredient.ind_name,
            (SUM(ingredient_lot_detail.qty_stock) DIV ingredient.qty_per_unit) AS ind_stock,
            ingredient.qtyminimum
          FROM ingredient 
          LEFT JOIN ingredient_lot_detail ON ingredient.ind_id = ingredient_lot_detail.ind_id
          LEFT JOIN ingredient_lot ON ingredient_lot_detail.indl_id = ingredient_lot.indl_id
          WHERE ingredient_lot.status = 2
          AND ingredient_lot_detail.deleted_at IS NULL
          AND ingredient_lot_detail.date_exp > NOW()
          GROUP BY ingredient.ind_id
          HAVING ind_stock <= ingredient.qtyminimum
        `;

        const [ingredients] = await connection.promise().query(ingredientQuery);

        if (ingredients.length === 0) {
            console.log('No low stock ingredients found');
            return; // Exit if no low stock ingredients found
        }

        console.log('Low stock ingredients:', ingredients);

        // Query to get the staff members
        const staffQuery = `
        SELECT st_id 
        FROM staff 
        WHERE st_type = 0 OR st_type = 1
        `;
        const [staff] = await connection.promise().query(staffQuery);

        // Create a list of user IDs (st_id values)
        const userIds = staff.map(staffMember => staffMember.st_id).join(',');

        // For each ingredient with low stock, insert a new notification
        for (const ingredient of ingredients) {
            const notificationQuery = `
              INSERT INTO notification (ind_id, user_id, type,qty)
              VALUES (?, ?, 'I',?)
            `;
            await connection.promise().query(notificationQuery, [ingredient.ind_id, userIds, ingredient.ind_stock]);

            // Optionally, send real-time notifications to users via socket.io
            const newNotification = {
                ind_id: ingredient.ind_id,
                ind_name: ingredient.ind_name,
                user_id: userIds,
                type: 'I', // Assuming 'I' stands for ingredient notification,
                qty: ingredient.ind_stock,
                // createdAt: new Date()
            };

            const userList = userIds.split(',');
            console.log(userList, 'userIds');
            userList.forEach((user) => {
                console.log(user, 'user');

                io.to(user).emit('newNotification', newNotification);
            });
        }

        console.log('Notifications added for low stock ingredients');
    } catch (error) {
        console.error('Error checking and adding notifications:', error);
    }
}

//เอาวันที่ยังไม่หมดอายุ
// SELECT 
//             pd.pd_name,
//             pd.pd_qtyminimum,
//             pdorde.*,        
//             rc.qtylifetime as lifetime,
//             DATE_ADD(pdorde.created_at, INTERVAL rc.qtylifetime DAY) as exp
//         FROM 
//             productionorderdetail pdorde
//         LEFT JOIN 
//             products AS pd ON pd.pd_id = pdorde.pd_id
//         LEFT JOIN 
//             recipe AS rc ON  pd.pd_id = rc.pd_id
//         LEFT JOIN 
//             productionorder AS pdo ON pdo.pdo_id = pdorde.pdo_id
//         WHERE  
//             pdo.pdo_status = 4
//         AND 
//             pdorde.deleted_at IS NULL
//             AND
//             DATE_ADD(pdorde.created_at, INTERVAL rc.qtylifetime DAY) > NOW()
//         GROUP BY 
//             pdorde.pd_id;

//pd ใกล้หมดอายุ 2 วัน
async function checkAndAddPrductNotificationsstock(io) {
    try {
        // console.log('ใช้ io ใน checkAndAddNotifications:', io);

        // First query to get total stock of ingredients
        const query = `
        SELECT 
            pd.pd_name,
            pd.pd_qtyminimum,
            pdorde.*,        
            rc.qtylifetime as lifetime,
            DATE_ADD(pdorde.created_at, INTERVAL rc.qtylifetime DAY) as exp,
            DATE(DATE_ADD(pdorde.created_at, INTERVAL rc.qtylifetime DAY) - INTERVAL 2 DAY) as twoexp,
            CURDATE()
        FROM 
            productionorderdetail pdorde
        LEFT JOIN 
            products AS pd ON pd.pd_id = pdorde.pd_id
        LEFT JOIN 
            recipe AS rc ON  pd.pd_id = rc.pd_id
        LEFT JOIN 
            productionorder AS pdo ON pdo.pdo_id = pdorde.pdo_id
        WHERE  
            pdo.pdo_status = 4
        AND 
            pdorde.deleted_at IS NULL
        AND 
            DATE(DATE_ADD(pdorde.created_at, INTERVAL rc.qtylifetime DAY) - INTERVAL 2 DAY) = CURDATE()
        and pdorde.pdod_stock > 0
        `;

        const [results] = await connection.promise().query(query);
        console.log('results', results);

        if (results.length === 0) {
            console.log('No expiring products found');
            return; // Exit if no expiring products found
        }

        for (const ingredient of results) {
            // Query to check if a notification for this pdod_id already exists
            const checkNotificationQuery = `
            SELECT COUNT(*) as count 
            FROM notification 
            WHERE pdod_id = ?
            `;
            const [notificationExists] = await connection.promise().query(checkNotificationQuery, [ingredient.pdod_id]);

            // If the notification already exists, skip this product
            if (notificationExists[0].count > 0) {
                console.log(`Notification already exists for pdod_id: ${ingredient.pdod_id}`);
                continue;
            }

            // Query to get the staff members
            const staffQuery = `
            SELECT st_id 
            FROM staff 
            WHERE st_type = 0 OR st_type = 2
            `;
            const [staff] = await connection.promise().query(staffQuery);

            // Create a list of user IDs (st_id values)
            const userIds = staff.map(staffMember => staffMember.st_id).join(',');

            // Insert the new notification
            const notificationQuery = `
              INSERT INTO notification (pdod_id, user_id, type, dateexp)
              VALUES (?, ?, 'P', ?)
            `;
            await connection.promise().query(notificationQuery, [ingredient.pdod_id, userIds, ingredient.exp]);

            // Create new notification object for socket.io
            const newNotification = {
                pd_name: ingredient.pd_name,
                user_id: userIds,
                type: 'P',
                exp: ingredient.exp,
            };

            // Send real-time notifications via socket.io
            const userList = userIds.split(',');
            userList.forEach((user) => {
                io.to(user).emit('newNotification', newNotification);
            });
        }

        console.log('Notifications added for expiring products');
    } catch (error) {
        console.error('Error checking and adding notifications:', error);
    }
}

//ind ใกล้หมดอายุ 2 วัน
async function checkAndAddIndNotificationsstock(io) {
    try {
        // console.log('ใช้ io ใน checkAndAddNotifications:', io);

        // First query to get total stock of ingredients
        const query = `
        SELECT 
            indlde.*, ind.*
        FROM 
            ingredient_lot_detail indlde
        LEFT JOIN 
            ingredient AS ind ON ind.ind_id = indlde.ind_id
        LEFT JOIN 
            ingredient_lot AS indl ON indl.indl_id = indlde.indl_id
        WHERE  
            indl.status = 2
        AND 
            indlde.deleted_at IS NULL
        AND 
            DATE(DATE_SUB(date_exp, INTERVAL 2 DAY)) = CURDATE();
    
        `;

        const [results] = await connection.promise().query(query);
        console.log('results', results);

        if (results.length === 0) {
            console.log('No expiring products found');
            return; // Exit if no expiring products found
        }

        for (const ingredient of results) {
            // Query to check if a notification for this pdod_id already exists
            const checkNotificationQuery = `
            SELECT COUNT(*) as count 
            FROM notification 
            WHERE indlde_id = ?
            `;
            const [notificationExists] = await connection.promise().query(checkNotificationQuery, [ingredient.indlde_id]);

            // If the notification already exists, skip this product
            if (notificationExists[0].count > 0) {
                console.log(`Notification already exists for indlde_id: ${ingredient.indlde_id}`);
                continue;
            }

            // Query to get the staff members
            const staffQuery = `
            SELECT st_id 
            FROM staff 
            WHERE st_type = 0 OR st_type = 1
            `;
            const [staff] = await connection.promise().query(staffQuery);

            // Create a list of user IDs (st_id values)
            const userIds = staff.map(staffMember => staffMember.st_id).join(',');

            // Insert the new notification
            const notificationQuery = `
              INSERT INTO notification (indlde_id, user_id, type, dateexp)
              VALUES (?, ?, 'L', ?)
            `;
            await connection.promise().query(notificationQuery, [ingredient.indlde_id, userIds, ingredient.date_exp]);

            // Create new notification object for socket.io
            const newNotification = {
                ind_name: ingredient.ind_name,
                user_id: userIds,
                type: 'L',
                date_exp: ingredient.date_exp,
            };

            // Send real-time notifications via socket.io
            const userList = userIds.split(',');
            userList.forEach((user) => {
                io.to(user).emit('newNotification', newNotification);
            });
        }

        console.log('Notifications added for expiring ');
    } catch (error) {
        console.error('Error checking and adding notifications:', error);
    }
}


// router.post('/markAsRead', async (req, res) => {
//     const userId = req.body.userId;

//     try {
//         // Update read_id to include the userId
//         const updateQuery = `
//             UPDATE notification 
//             SET read_id = CONCAT(IFNULL(read_id, ''), ',', ?)
//             WHERE FIND_IN_SET(?, user_id)
//             AND (read_id IS NULL OR NOT FIND_IN_SET(?, read_id))
//         `;
//         await queryAsync(updateQuery, [userId, userId, userId]);
//         res.json({ message: 'Notifications updated as read' });
//     } catch (error) {
//         console.error('Error updating notifications:', error);
//         res.status(500).json({ message: 'Error updating notifications' });
//     }
// });



// //เพิ่มเรื่องหน่วงเวลา เพื่อให้มันเห็นแตกต่างกัน
router.post('/markAsRead', async (req, res) => {
    const userId = req.body.userId;

    try {
        // ตรวจสอบก่อนว่ามี userId ใน read_id แล้วหรือยัง
        const checkQuery = `
            SELECT read_id 
            FROM notification 
            WHERE FIND_IN_SET(?, user_id)
            AND (read_id IS NULL OR NOT FIND_IN_SET(?, read_id))
        `;
        const result = await queryAsync(checkQuery, [userId, userId]);

        // ถ้า result มีแสดงว่ายังไม่มี userId ใน read_id
        if (result.length > 0) {
            // รอ 15 วินาทีก่อนอัปเดต
            setTimeout(async () => {
                const updateQuery = `
                    UPDATE notification 
                    SET read_id = CONCAT(IFNULL(read_id, ''), ',', ?)
                    WHERE FIND_IN_SET(?, user_id)
                    AND (read_id IS NULL OR NOT FIND_IN_SET(?, read_id))
                `;
                await queryAsync(updateQuery, [userId, userId, userId]);
                res.json({ message: 'Notifications updated as read after 10 seconds' });
            }, 15000); // รอ 10 วินาที (10,000 milliseconds)
        } else {
            // ถ้า userId มีอยู่แล้วใน read_id
            res.json({ message: 'No update needed, userId is already in read_id' });
        }
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ message: 'Error updating notifications' });
    }
});


// router.get('/unread', async (req, res) => {
//     const userId = req.session.st_id;

//     try {
//         const query = `
//             SELECT notification.*, ingredient.ind_name, ingredient.ind_stock, ingredient.qtyminimum
//             FROM notification
//             JOIN ingredient ON notification.ind_id = ingredient.ind_id
//             WHERE FIND_IN_SET(?, notification.user_id)
//             AND (notification.read_id IS NULL OR NOT FIND_IN_SET(?, notification.read_id))
//         `;
//         const results = await queryAsync(query, [userId, userId]);
//         // console.log('results', results);
//         res.json(results);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching notifications' });
//     }
// });


// SELECT 
//         notification.*, 
//         productionorderdetail.pd_id as pdinpddo,
//         products.pd_name as podde_pdname,
//         ingredient.ind_name, 
//         ingredient.ind_stock, 
//         ingredient.qtyminimum, 
//         DATE_FORMAT(notification.created_at, '%d-%m-%Y') AS formatted_created_at
//     FROM 
//         notification
//     left JOIN 
//         ingredient ON notification.ind_id = ingredient.ind_id
//     left JOIN 
//         productionorderdetail ON notification.pdod_id  = productionorderdetail.pdod_id
//         left JOIN 
//         products ON products.pd_id  = productionorderdetail.pd_id  
//     WHERE 
//         FIND_IN_SET(?, notification.user_id)
//     ORDER BY 
//         notification.created_at DESC;
    
router.get('/unread', async (req, res) => {
    const userId = req.session.st_id;

    try {
        const query = `
        SELECT 
        notification.*, 
        DATE_FORMAT(notification.dateexp, '%Y-%m-%d') AS dateexp,
        DATE_FORMAT(productionorderdetail.created_at, '%Y-%m-%d') AS pcreated_at,
        productionorderdetail.pd_id as pdinpddo,
        products.pd_name as podde_pdname,
        ingredient.ind_name, 
        ingredient.ind_stock, 
        ingredient.qtyminimum, 
        ingredient_lot_detail.indlde_id ,
        DATE_FORMAT(ingredient_lot_detail.date_exp, '%Y-%m-%d') AS indlexp,
        ind.ind_name as nameindlot,
        CONCAT('L', LPAD(ingredient_lot_detail.indl_id, 7, '0')) AS indl_id_name,

            CASE
                WHEN notification.read_id IS NULL OR NOT FIND_IN_SET(?, notification.read_id)
                THEN 'N'
                ELSE 'R'
            END AS read_status
        FROM 
            notification
        left JOIN 
            ingredient ON notification.ind_id = ingredient.ind_id
        left JOIN 
            productionorderdetail ON notification.pdod_id  = productionorderdetail.pdod_id
        left JOIN 
            products ON products.pd_id  = productionorderdetail.pd_id  
        left JOIN 
            ingredient_lot_detail ON ingredient_lot_detail.indlde_id   = notification.indlde_id   
        left JOIN 
            ingredient as ind ON ind.ind_id   = ingredient_lot_detail.ind_id   
        
        WHERE 
            FIND_IN_SET(?, notification.user_id)
        ORDER BY 
            notification.created_at DESC;
    
        `;

        // const results = await queryAsync(query, [userId, userId]);
        // res.json(results);
        const results = await queryAsync(query, [userId, userId]);

        // คำนวณเวลาที่ผ่านไปจาก created_at
        const notificationsWithTimeAgo = results.map(notification => {
            const timeAgo = calculateTimeAgo(notification.created_at);
            return {
                ...notification,
                timeAgo
            };
        });
        res.json(notificationsWithTimeAgo);
        // console.log('Fetched notifications for user:', notificationsWithTimeAgo);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications' });
        console.error('Error fetching notifications:', error);
    }
});


// เพิ่ม endpoint สำหรับการดึงการแจ้งเตือนทั้งหมด
// router.get('/all', async (req, res) => {
//     const userId = req.session.st_id; // หรือคุณสามารถใช้ req.user.id ถ้ามีการใช้ middleware สำหรับการยืนยันตัวตน

//     try {
//         const query = `
//             SELECT notification.*, ingredient.ind_name, ingredient.ind_stock, ingredient.qtyminimum
//             FROM notification
//             JOIN ingredient ON notification.ind_id = ingredient.ind_id
//             WHERE FIND_IN_SET(?, notification.user_id)
//             ORDER BY notification.created_at DESC
//         `;

//         const results = await queryAsync(query, [userId]);
//         console.log('Fetched notifications for user:', results);
//         res.json(results);
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({ message: 'Error fetching notifications' });
//     }
// });

//เพิ่มเรื่อง วัน เวลา
router.get('/all', async (req, res) => {
    const userId = req.session.st_id; // หรือใช้ req.user.id ถ้ามีการใช้ middleware สำหรับการยืนยันตัวตน

    try {
    //     const query = `
    //     SELECT 
    //     notification.*, 
    //     productionorderdetail.pd_id as pdinpddo,
    //     products.pd_name as podde_pdname,
    //     ingredient.ind_name, 
    //     ingredient.ind_stock, 
    //     ingredient.qtyminimum, 
    //     DATE_FORMAT(notification.created_at, '%d-%m-%Y') AS formatted_created_at
    // FROM 
    //     notification
    // left JOIN 
    //     ingredient ON notification.ind_id = ingredient.ind_id
    // left JOIN 
    //     productionorderdetail ON notification.pdod_id  = productionorderdetail.pdod_id
    // left JOIN 
    //     products ON products.pd_id  = productionorderdetail.pd_id  
    // WHERE 
    //     FIND_IN_SET(?, notification.user_id)
    // ORDER BY 
    //     notification.created_at DESC;
    
    //     `;
        const query = `
        SELECT 
        notification.*, 
        DATE_FORMAT(notification.dateexp, '%Y-%m-%d') AS dateexp,
        DATE_FORMAT(productionorderdetail.created_at, '%Y-%m-%d') AS pcreated_at,
        productionorderdetail.pd_id as pdinpddo,
        products.pd_name as podde_pdname,
        ingredient.ind_name, 
        ingredient.ind_stock, 
        ingredient.qtyminimum, 
        ingredient_lot_detail.indlde_id , 
        DATE_FORMAT(ingredient_lot_detail.date_exp, '%Y-%m-%d') AS indlexp,
        DATE_FORMAT(notification.created_at, '%d-%m-%Y') AS formatted_created_at,
        ind.ind_name as nameindlot,
        CONCAT('L', LPAD(ingredient_lot_detail.indl_id, 7, '0')) AS indl_id_name
     FROM 
        notification
    left JOIN 
        ingredient ON notification.ind_id = ingredient.ind_id
    left JOIN 
        productionorderdetail ON notification.pdod_id  = productionorderdetail.pdod_id
    left JOIN 
        products ON products.pd_id  = productionorderdetail.pd_id  
    left JOIN 
        ingredient_lot_detail ON ingredient_lot_detail.indlde_id   = notification.indlde_id   
    left JOIN 
        ingredient as ind ON ind.ind_id   = ingredient_lot_detail.ind_id   
    WHERE 
        FIND_IN_SET(?, notification.user_id)
    ORDER BY 
        notification.created_at DESC;
    
        `;

        const results = await queryAsync(query, [userId]);

        // คำนวณเวลาที่ผ่านไปจาก created_at
        const notificationsWithTimeAgo = results.map(notification => {
            const timeAgo = calculateTimeAgo(notification.created_at);
            return {
                ...notification,
                timeAgo
            };
        });

        // console.log('Fetched notifications for user:', notificationsWithTimeAgo);
        res.json(notificationsWithTimeAgo);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// ฟังก์ชันสำหรับคำนวณเวลาที่ผ่านไป
function calculateTimeAgo(createdAt) {
    const createdTime = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now - createdTime) / 1000);

    let timeAgo;

    if (diffInSeconds < 60) {
        timeAgo = `${diffInSeconds} วินาทีที่แล้ว`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        timeAgo = `${minutes} นาทีที่แล้ว`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        timeAgo = `${hours} ชั่วโมงที่แล้ว`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        timeAgo = `${days} วันที่แล้ว`;
    }

    return timeAgo;
}

module.exports = { router, checkAndAddNotifications,checkAndAddPrductNotificationsstock ,checkAndAddIndNotificationsstock};