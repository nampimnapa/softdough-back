const express = require("express");
const connection = require("../connection");
const router = express.Router();
const bcrypt = require('bcrypt');
const  {ifNotLoggedIn,ifLoggedIn, isAdmin,isUserProduction,isUserOrder} = require('../middleware')

router.post('/add', async (req, res, next) => {
  const staff = req.body;

  try {
    // Hash password
    const hash = await bcrypt.hash(staff.st_password, 10);

    // Check if the username already exists
    const [checkResults] = await connection.query(
      'SELECT COUNT(*) AS count FROM staff WHERE st_username = ?',
      [staff.st_username]
    );

    if (checkResults[0].count > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Insert new staff
    const [insertResult] = await connection.query(
      'INSERT INTO staff (st_username, st_password, st_name, st_tel, st_start, st_type, st_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        staff.st_username,
        hash,
        staff.st_name,
        staff.st_tel,
        staff.st_start,
        staff.st_type,
        staff.st_status,
      ]
    );

    console.log(req.session);
    res.status(200).json({ message: 'success', insertId: insertResult.insertId });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'error', error: error.message });
  }
});


router.get('/read', async (req, res, next) => {
  try {
    const query = 'SELECT * FROM staff';
    const [results] = await connection.query(query);
    return res.status(200).json(results);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/read/:id', async (req, res, next) => {
  const st_id = req.params.id;
  const query = `
    SELECT staff.*, 
    DATE_FORMAT(st_start, '%Y-%m-%d') AS date_start,
    DATE_FORMAT(st_end, '%Y-%m-%d') AS date_end
    FROM staff WHERE st_id = ?
  `;

  try {
    const [results] = await connection.query(query, [st_id]);
    
    if (results.length > 0) {
      return res.status(200).json(results[0]);
    } else {
      return res.status(404).json({ message: "Staff not found" });
    }
  } catch (err) {
    console.error('Database query error:', err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

router.patch('/updatestatus/:id', async (req, res, next) => {
  const st_id = req.params.id;
  const staff = req.body;

  try {
    if (staff.st_status === 2) {
      const query = "UPDATE staff SET st_status=?, st_end=? WHERE st_id=?";
      const [results] = await connection.query(query, [staff.st_status, staff.st_end, st_id]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Staff not found" });
      }
      return res.status(200).json({ message: "Update successful" });
    } else {
      return res.status(400).json({ message: "Invalid status value" });
    }
  } catch (err) {
    console.error('Database query error:', err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

//รวม ยังไม่เทส
router.patch('/update/:id', async (req, res, next) => {
  const st_id = req.params.id;
  const staff = req.body;

  try {
    let query, params;

    if (staff.st_status === "2" || staff.st_status === 2) {
      const st_end = staff.st_end ? new Date(staff.st_end.split('-').reverse().join('-')) : null;
      query = `
        UPDATE staff 
        SET st_status = ?, st_end = ?
        WHERE st_id = ?
      `;
      params = [staff.st_status, st_end, st_id];
    } else {
      // Hash the password if it's provided
      if (staff.st_password) {
        staff.st_password = await bcrypt.hash(staff.st_password, 10);
      }

      // Handle st_type
      let st_type;
      if (staff.st_type === 'on') {
        st_type = 1;  // หรือค่าที่เหมาะสมสำหรับ 'on'
      } else if (staff.st_type === 'off') {
        st_type = 0;  // หรือค่าที่เหมาะสมสำหรับ 'off'
      } else {
        st_type = staff.st_type;  // ใช้ค่าที่ส่งมาถ้าไม่ใช่ 'on' หรือ 'off'
      }

      query = `
        UPDATE staff 
        SET st_username = ?, st_password = ?, st_name = ?, st_tel = ?, st_type = ? 
        WHERE st_id = ?
      `;
      params = [staff.st_username, staff.st_password, staff.st_name, staff.st_tel, st_type, st_id];
    }

    const [results] = await connection.query(query, params);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }
    return res.status(200).json({ message: "Update successful" });

  } catch (err) {
    console.error('Database query error:', err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});


module.exports = router;