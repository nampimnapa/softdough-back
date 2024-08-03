// const ifNotLoggedIn = (req, res, next) => {
//     if (!req.session.isLoggedIn) {
//         return res.status(404).json({ message: "ifNotLoggedIn" });
//     }
//     next();
// }

// const ifLoggedIn = (req, res, next, status) => {
//     if (req.session && req.session.isLoggedIn) {
//         if (req.session.st_type === '0') {
//             res.status(status).json({ message: "You are already logged in as an admin" });
//         } else if (req.session.st_type === '1') {
//             res.status(status).json({ message: "You are already logged in as a pro" });
//         } else {
//             res.status(status).json({ message: "You are already logged in as a or" });
//         }
//     } else {
//         next();
//     }
// };


// const isAdmin = (req, res, next) => {
//     if (req.session.isLoggedIn && req.session.st_type === '0') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not an admin
//     }
// };

// const isUserProduction = (req, res, next) => {
//     if (req.session.isLoggedIn && req.session.st_type === '1') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not a user
//     }
// };

// const isUserOrder = (req, res, next) => {
//     if (req.session.isLoggedIn && req.session.st_type === '2') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not a user
//     }
// };


// module.exports = {ifNotLoggedIn,ifLoggedIn, isAdmin,isUserProduction,isUserOrder};
const ifNotLoggedIn = (req, res, next) => {
    if (!req.session || !req.session.isLoggedIn) {
        return res.status(404).json({ message: "ifNotLoggedIn" });
    }
    next();
}

const ifLoggedIn = (req, res, next, status) => {
    if (req.session && req.session.isLoggedIn) {
        if (req.session.st_type === '0') {
            res.status(status).json({ message: "You are already logged in as an admin" });
        } else if (req.session.st_type === '1') {
            res.status(status).json({ message: "You are already logged in as a pro" });
        } else {
            res.status(status).json({ message: "You are already logged in as a or" });
        }
    } else {
        next();
    }
};

// const isAdmin = (req, res, next) => {
//     console.log(req.session,req.session.isLoggedIn)
//     if (req.session && req.session.isLoggedIn && req.session.st_type === '0') {
//         next(); // อนุญาตให้เข้าถึง middleware หรือ route handler ต่อไป
//     } else {
//         res.status(403).send('Access Forbidden'); // ส่งค่าสถานะ 403 Forbidden ถ้าไม่ใช่ admin
//     }
// };


// const isUserProduction = (req, res, next) => {
//     if (req.session && req.session.isLoggedIn && req.session.st_type === '1') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not a user
//     }
// };

// const isUserOrder = (req, res, next) => {
//     if (req.session && req.session.isLoggedIn && req.session.st_type === '2') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not a user
//     }
// };
const isAdmin = (req, res, next) => {
    // console.log(req)
    // ifNotLoggedIn(req, res, () => {
        if (req.session && req.session.st_type === '0') {
            next();
        } else {
            res.status(403).send('Access Forbidden');
        }
    // });
};


const isUserProduction = (req, res, next) => {
    if (req.session && req.session.st_type === '1') {
        next(); // อนุญาตให้เข้าถึง middleware หรือ route handler ต่อไป
    } else {
        res.status(403).send('Access Forbidden'); // ส่งค่าสถานะ 403 Forbidden ถ้าไม่ใช่ production user
    }
};

const isUserOrder = (req, res, next) => {
    if (req.session && req.session.st_type === '2') {
        next(); // อนุญาตให้เข้าถึง middleware หรือ route handler ต่อไป
    } else {
        res.status(403).send('Access Forbidden'); // ส่งค่าสถานะ 403 Forbidden ถ้าไม่ใช่ order user
    } 
};

const isAdminUserOrder = (req, res, next) => {
    if (req.session && (req.session.st_type === '0' || req.session.st_type === '1')) {
        next(); // Allow to proceed to the next middleware or route handler
    } else {
        res.status(403).send('Access Forbidden'); // Send 403 Forbidden status if not an admin or order user
    } 
};
const isALL = (req, res, next) => {
    if (req.session && (req.session.st_type === '0' || req.session.st_type === '1' || req.session.st_type === '2')) {
        next(); // Allow to proceed to the next middleware or route handler
    } else {
        res.status(403).send('Access Forbidden'); // Send 403 Forbidden status if not an admin or order user
    } 
};


module.exports = { ifNotLoggedIn, ifLoggedIn, isAdmin, isUserProduction, isUserOrder,isAdminUserOrder,isALL };
