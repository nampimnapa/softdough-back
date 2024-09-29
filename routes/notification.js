// const express = require('express');
// const connection = require("../connection");
// const router = express.Router();


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
// const checkMinimumIngredient = async () => {
//     try {
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


// //ถามแชทไว้ยังไม่เอามาวาง
// // API for fetching unread notifications
// router.get('/unread', async (req, res) => {
//     // const { userId } = req.query;
//     const userId = req.session.st_id; // ดึง user_id จาก session

//     try {
//       const query = `
//         SELECT notification.*, ingredient.ind_name, ingredient.ind_stock, ingredient.qtyminimum
//         FROM notification
//         JOIN ingredient ON notification.ind_id = ingredient.ind_id
//         WHERE FIND_IN_SET(?, notification.user_id)
//         AND (notification.read_id IS NULL OR NOT FIND_IN_SET(?, notification.read_id))
//       `;
//       const results = await queryAsync(query, [userId, userId]);
      
//       console.log(results);
//       res.json(results);
//     } catch (error) {
//       console.error('Error fetching unread notifications:', error);
//       res.status(500).json({ message: 'Error fetching notifications' });
//     }
// });

  

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


// module.exports = router; // แค่ router เท่านั้น
// module.exports.checkMinimumIngredient = checkMinimumIngredient;

const express = require('express');
const connection = require("../connection");
const router = express.Router();
const util = require('util');

// Promisify the query method
const queryAsync = util.promisify(connection.query).bind(connection);

const checkMinimumIngredient = async (io) => {
    try {
        const query = `
            SELECT 
                ingredient.ind_id,
                ingredient.ind_name,
                ingredient.ind_stock,
                ingredient.qtyminimum
            FROM ingredient 
            HAVING 
                ROUND(CAST(ingredient.ind_stock AS DECIMAL), 2) <= ROUND(CAST(ingredient.qtyminimum AS DECIMAL), 2)
        `;
        const ingredients = await queryAsync(query);

        if (ingredients.length > 0) {
            console.log('Low stock ingredients:', ingredients);

            const querystaff = `
                SELECT st_id FROM staff WHERE st_type = 0 OR st_type = 1
            `;
            const staffResults = await queryAsync(querystaff);
            const userIds = staffResults.map(staff => staff.st_id).join(',');

            for (let ingredient of ingredients) {
                const insertQuery = `
                    INSERT INTO notification (pd_id, ind_id, user_id, type) 
                    VALUES (?, ?, ?, ?)
                `;
                const values = [null, ingredient.ind_id, userIds, 'I'];
                await queryAsync(insertQuery, values);
            }

            // ตรวจสอบว่า io ถูกส่งเข้ามา
            if (io) {
                io.emit('lowStockNotification', ingredients);
            } else {
                console.error('Socket.IO (io) is not defined');
            }
        }

        return ingredients;
    } catch (error) {
        console.error('MySQL Error:', error);
        return [];
    }
};


router.get('/unread', async (req, res) => {
    const userId = req.session.st_id;

    try {
        const query = `
            SELECT notification.*, ingredient.ind_name, ingredient.ind_stock, ingredient.qtyminimum
            FROM notification
            JOIN ingredient ON notification.ind_id = ingredient.ind_id
            WHERE FIND_IN_SET(?, notification.user_id)
            AND (notification.read_id IS NULL OR NOT FIND_IN_SET(?, notification.read_id))
        `;
        const results = await queryAsync(query, [userId, userId]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

router.post('/markAsRead', async (req, res) => {
    const { noti_id } = req.body;
    const userId = req.session.st_id;

    try {
        const query =  `SELECT read_id FROM notification WHERE noti_id = ? `;
        const result = await queryAsync(query, [noti_id]);

        let readId = result[0]?.read_id || '';
        if (!readId.includes(userId)) {
            readId = readId ?  `${readId} , ${userId} ` :  `${userId} `;
            const updateQuery =  `UPDATE notification SET read_id = ? WHERE noti_id = ? `;
            await queryAsync(updateQuery, [readId, noti_id]);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error marking notification as read' });
    }
});

module.exports = { router, checkMinimumIngredient };