
const express = require('express');
const connection = require("../connection");
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const { body, validationResult, Result } = require('express-validator');
const { promise } = require('bcrypt/promises');
const { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder ,isAdminUserOrder} = require('../middleware')


const util = require('util');
const executeAsync = util.promisify(connection.execute).bind(connection);

// Middleware to initialize req.session


router.post('/login', ifLoggedIn, [
    body('username').custom((value) => {
        return executeAsync("select st_username from staff where st_username = ?", [value])
            .then(([rows]) => {
                console.log(rows)
                if (rows) {
                    return true;
                }
                return Promise.reject('Invalid st_username')
            });
    }),
    body('password', 'pass is empty').trim().not().isEmpty(),
], (req, res) => {
    const validation_Result = validationResult(req);
    const { username, password } = req.body;
    console.log(username, password)

    if (validation_Result.isEmpty()) {
        executeAsync('select * from staff where st_username = ?', [username])
            .then(([rows]) => {
                console.log(rows)
                bcrypt.compare(password, rows.st_password).then(compare_result => {
                    if (compare_result === true) {
                        req.session.isLoggedIn = true;
                        req.session.st_id = rows.st_id;
                        req.session.st_type = rows.st_type; // Set userRole in session

                        // Redirect based on user role
                        // if (req.session.st_type === '0') {
                        //     res.status(200).json({ message: "Successful admin login" });
                        //     console.log(req.session)
                        // } else if (req.session.st_type === '1') {
                        //     res.status(200).json({ message: "Successful production login" });
                        //     console.log(req.session)

                        // } else if (req.session.st_type === '2') {
                        //     res.status(200).json({ message: "Successful order login" });
                        //     console.log(req.session)

                        // } else {
                        //     // Send "Successful login" message for API JSON testing
                        //     res.json({ message: "Successful login" });
                        // }
                        if (req.session.st_type === '0') {
                            res.status(200).json({ message: "Successful admin login", st_id: req.session.st_id });
                            console.log(req.session)
                        } else if (req.session.st_type === '1') {
                            res.status(200).json({ message: "Successful production login", st_id: req.session.st_id });
                            console.log(req.session)
                        } else if (req.session.st_type === '2') {
                            res.status(200).json({ message: "Successful order login", st_id: req.session.st_id });
                            console.log(req.session)
                        } else {
                            res.json({ message: "Successful login", st_id: req.session.st_id }); // เพิ่ม st_id ที่นี่
                        }
                        
                    } else {
                        res.status(500).json({
                            login_errors: ['Invalid password']
                        })
                    }
                }).catch(err => {
                    if (err) throw err;
                })
            }).catch(err => {
                if (err) throw err;
            })
    } else {
        let allerror = validation_Result.errors.map((error) => {
            return error.msg;
        })
        res.status(500).json({
            login_errors: allerror
        })
    }
});
 

router.get('/logout', (req, res) => {
    req.session = null;
    res.status(200).json({ message: "logout" });
});

module.exports = router;