const express = require("express");
const connection = require("../connection");
const router = express.Router();

// router.post('/add',(req,res,next)=>{
//     let staff = req.body;
//     query = "insert into staff (st_username,st_password,st_name,st_tel,st_start,st_end,st_type,st_status) values(?,?,?,?,?,?,?,?)";
//     connection.query(query, [owner.own_username, owner.own_password, owner.own_name], (err, results) => {
//         if (!err) {
//             return res.status(200).json({ message: "success" });
//         } else {
//             console.error("MySQL Error:", err);
//             return res.status(500).json({ message: "error", error: err });
//         }
//     });      
// })

const bcrypt = require('bcryptjs');
const  {ifNotLoggedIn,ifLoggedIn, isAdmin,isUserProduction,isUserOrder} = require('../middleware')


router.post('/add', (req, res, next) => {
  let staff = req.body;

  // Generate salt and hash password
  bcrypt.hash(staff.st_password, 10, (hashErr, hash) => {
    if (hashErr) {
      console.error('Bcrypt Error:', hashErr);
      return res.status(500).json({ message: 'error', error: hashErr });
    }

    // Check if the username already exists
    let checkUsernameQuery = 'SELECT COUNT(*) AS count FROM staff WHERE st_username = ?';

    connection.query(checkUsernameQuery, [staff.st_username], (checkErr, checkResults) => {
      if (!checkErr) {
        // If username already exists, return an error response
        if (checkResults[0].count > 0) {
          return res.status(400).json({ message: 'Username already exists' });
        }

        // If username doesn't exist, proceed with the insertion
        let insertQuery =
          'INSERT INTO staff (st_username, st_password, st_name, st_tel, st_start, st_type, st_status) VALUES (?, ?, ?, ?, ?, ?, ?)';

        connection.query(
          insertQuery,
          [
            staff.st_username,
            hash, // Store hashed password
            staff.st_name,
            staff.st_tel,
            staff.st_start,
            staff.st_type,
            staff.st_status,
          ],
          (err, results) => {
            if (!err) {
              console.log(req.session)

              return res.status(200).json({ message: 'success' });
            } else {
              console.error('MySQL Error:', err);
              return res.status(500).json({ message: 'error', error: err });
            }
          }
        );
      } else {
        console.error('MySQL Error:', checkErr);
        return res.status(500).json({ message: 'error', error: checkErr });
      }
    });
  });
});


// router.post('/add', (req, res, next) => {
//   let staff = req.body;

//   // Check if the username already exists
//   let checkUsernameQuery = 'SELECT COUNT(*) AS count FROM staff WHERE st_username = ?';

//   connection.query(checkUsernameQuery, [staff.st_username], (checkErr, checkResults) => {
//     if (!checkErr) {
//       // If username already exists, return an error response
//       if (checkResults[0].count > 0) {
//         return res.status(400).json({ message: 'Username already exists' });
//       }

//       // If username doesn't exist, proceed with the insertion
//       let insertQuery =
//         'INSERT INTO staff (st_username, st_password, st_name, st_tel, st_start, st_type, st_status) VALUES (?, ?, ?, ?, ?, ?, ?)';

//       connection.query(
//         insertQuery,
//         [
//           staff.st_username,
//           staff.st_password,
//           staff.st_name,
//           staff.st_tel,
//           staff.st_start,
//           staff.st_type,
//           staff.st_status,
//         ],
//         (err, results) => {
//           if (!err) {
//             return res.status(200).json({ message: 'success' });
//           } else {
//             console.error('MySQL Error:', err);
//             return res.status(500).json({ message: 'error', error: err });
//           }
//         }
//       );
//     } else {
//       console.error('MySQL Error:', checkErr);
//       return res.status(500).json({ message: 'error', error: checkErr });
//     }
//   });
// });

// router.get('/read',isAdmin, (req, res, next) => {
//   var query = 'select *from staff'
//   connection.query(query, (err, results) => {
//     if (!err) {
//       return res.status(200).json(results);
//     } else {
//       return res.status(500).json(err);
//     }
//   });
// })
router.get('/read', (req, res) => {
  const query = 'SELECT * FROM staff';
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database error:', err); // Log the error for debugging
          return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(results);
  });
});

router.get('/read/:id', (req, res, next) => {
  const st_id = req.params.id;
  var query = `SELECT staff.*, 
  DATE_FORMAT(st_start, '%Y-%m-%d') AS date_start,
  DATE_FORMAT(st_end, '%Y-%m-%d') AS date_end
   FROM staff WHERE st_id = ?`;

  connection.query(query, [st_id], (err, results) => {
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

//อัปเดตทั้งหมด
// router.patch('/update/:id', (req, res, next) => {
//     const st_id = req.params.id;
//     const staff = req.body;
//     var query = "UPDATE staff SET st_username=?, st_password=?, st_name=?, st_tel=?, st_end=?,st_type=?, st_status=? WHERE st_id=?";
//     connection.query(query, [staff.st_username, staff.st_password, staff.st_name, staff.st_tel, staff.st_end,staff.st_type, staff.st_status,st_id], (err, results) => {
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

//แค่ลาออก ยังไม่เทส

router.patch('/updatestatus/:id', (req, res, next) => {
  const st_id = req.params.id;
  const staff = req.body;
  if (staff.st_status === 2) {
    var query = "UPDATE staff SET st_status=?, st_end=? WHERE st_id=?";
    connection.query(query, [staff.st_status, staff.st_end, st_id], (err, results) => {
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
  } else {
    return res.status(500).json(err)
  }

});

//รวม ยังไม่เทส
router.patch('/update/:id' ,(req, res, next) => {
  const st_id = req.params.id;
  const staff = req.body;

  // Check if st_status is 2
  if (staff.st_status === "2") {

    const updateData = req.body;

    // Convert the st_end date string to a MySQL-compatible date format
    const st_end = updateData.st_end ? new Date(updateData.st_end.split('-').reverse().join('-')) : null;

    // Update only st_status and st_end
    var query = `
        UPDATE staff 
        SET st_status = ?, st_end = ?
        WHERE st_id = ?
    `;

    connection.query(query, [updateData.st_status, st_end, st_id], (err, results) => {
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
  } else {
    // If st_status is not 2, update other fields as well
    var query = "UPDATE staff SET st_username=?, st_password=?, st_name=?, st_tel=?, st_type=? WHERE st_id=?";
    connection.query(query, [staff.st_username, staff.st_password, staff.st_name, staff.st_tel, staff.st_type, st_id], (err, results) => {
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
  }
});


module.exports = router;