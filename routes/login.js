
const express = require('express');
const connection = require("../connection");
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const { body, validationResult, Result } = require('express-validator');
// const { promise } = require('bcrypt/promises');
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder ,isAdminUserOrder} = require('../middleware')


const util = require('util');
// const executeAsync = util.promisify(connection.execute).bind(connection);
const db = connection.promise();

router.post('/login', ifLoggedIn, [
    body('username').custom(async (value) => {
        const [rows] = await db.query("SELECT st_username FROM staff WHERE st_username = ?", [value]);
        if (rows.length > 0) {
            return true;
        }
        return Promise.reject('Invalid st_username');
    }),
    body('password', 'Password is empty').trim().not().isEmpty(),
], async (req, res) => {
    const validation_Result = validationResult(req);
    const { username, password } = req.body;

    if (!validation_Result.isEmpty()) {
        const allErrors = validation_Result.errors.map(error => error.msg);
        return res.status(400).json({
            login_errors: allErrors
        });
    }

    try {
        const [rows] = await db.query("SELECT * FROM staff WHERE st_username = ?", [username]);
        
        if (rows.length === 0) {
            return res.status(401).json({
                login_errors: ['Invalid username or password']
            });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.st_password);
        if (!isPasswordValid) {
            return res.status(401).json({
                login_errors: ['Invalid password']
            });
        }

        // Successful login
        req.session.isLoggedIn = true;
        req.session.st_id = user.st_id;
        req.session.st_type = user.st_type;

        // เซ็ตคุกกี้ isLoggedIn ให้กับ response
        // // ใน API ของคุณ
        res.setHeader('Set-Cookie', `isLoggedIn=true; Path=/; HttpOnly`);

        let loginMessage = "Successful login";
        if (req.session.st_type === '0') {
            loginMessage = "Successful admin login";
        } else if (req.session.st_type === '1') {
            loginMessage = "Successful production login";
        } else if (req.session.st_type === '2') {
            loginMessage = "Successful order login";
        }

        res.status(200).json({
            message: loginMessage,
            st_id: req.session.st_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
});
 

// router.get('/logout', (req, res) => {
//     req.session = null;
//     res.status(200).json({ message: "logout" });
// });

router.get('/logout', (req, res) => {
    res.clearCookie('isLoggedIn');  // ลบคุกกี้ isLoggedIn
    req.session = null; // เคลียร์ session
    res.status(200).json({ message: "logout" });
  });

module.exports = router;