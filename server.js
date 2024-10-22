// // const express = require("express");
// // const connection = require("./connection");
// // const app = express();
// // const PORT = 8080;
// // const cors = require("cors");

// // const cookieSession = require('cookie-session');
// // // const bcrypt = require('bcrypt');
// // // const { body, validationResult, Result } = require('express-validator');

// // // app.use(cors());
// // // app.use(express.urlencoded({extended: true}));
// // // app.use(express.json());
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: false }));

// // app.use(cookieSession({
// //     name: "session",
// //     keys: ["key1", "key2"],
// //     maxAge: 3600 * 1000 //hr
// // }));

// // //ลองอันใหม่
// // const corsOptions = {
// //     origin: 'http://localhost:3000',
// //     credentials: true
// // };

// // app.use(cors(corsOptions));


// // const ownerRoute = require('./routes/owner')
// // const staffRoute = require('./routes/staff')

// // // const {Updateqtystock,router:ingredientRoute} = require('./routes/ingredient')
// // const ingredientRoute = require('./routes/ingredient')
// // const productRoute = require('./routes/product')
// // const salesmenuRoute = require('./routes/salesmenu')
// // const productionRoute = require('./routes/production')
// // const loginRoute = require('./routes/login')
// // const expensesRoute = require('./routes/expenses')

// // // const { ifLoggedIn,ifNotLoggedIn, router: loginRoute } = require('./routes/login');

// // app.use('/owner',ownerRoute)
// // app.use('/staff',staffRoute)
// // app.use('/ingredient',ingredientRoute)
// // app.use('/product',productRoute)
// // app.use('/salesmenu',salesmenuRoute)
// // app.use('/production',productionRoute)
// // app.use('/login',loginRoute)
// // app.use('/expenses',expensesRoute)

// // // Updateqtystock();


// // app.get("/home",(req,res)=>{
// //     res.json({message:"hello world!", pe:["taeyong","marklee","jaemin"]});
// // });
// // app.listen(PORT,()=>{
// //     console.log(`Server started on port ${PORT}`);
// // }) 
// const express = require("express");
// const connection = require("./connection");
// const app = express();
// const PORT = 8080;
// const cors = require("cors");

// const cookieSession = require('cookie-session');
// // const bcrypt = require('bcrypt');
// // const { body, validationResult, Result } = require('express-validator');

// // app.use(cors());
// // app.use(express.urlencoded({extended: true}));
// // app.use(express.json());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// app.use(cookieSession({
//     name: "session",
//     keys: ["key1", "key2"],
//     maxAge: 3600 * 1000 //hr
// }));

// //ลองอันใหม่
// const corsOptions = {
//     origin: 'http://localhost:3000',
//     credentials: true // Make sure to allow credentials
// };
// app.use(cors(corsOptions));



// const ownerRoute = require('./routes/owner')
// const staffRoute = require('./routes/staff')
// // const {Updateqtystock,router:ingredientRoute} = require('./routes/ingredient')
// const ingredientRoute = require('./routes/ingredient')
// const productRoute = require('./routes/product')
// const salesmenuRoute = require('./routes/salesmenu')
// const productionRoute = require('./routes/production')
// const loginRoute = require('./routes/login')
// const expensesRoute = require('./routes/expenses')
// const promotionRoute = require('./routes/promotion')
// const settingRoute = require('./routes/setting')
// const posRoute = require('./routes/pos')
// const notificationRoute = require('./routes/notification');

// // const { ifLoggedIn,ifNotLoggedIn, router: loginRoute } = require('./routes/login');

// app.use('/owner',ownerRoute)
// app.use('/staff',staffRoute)
// app.use('/ingredient',ingredientRoute)
// app.use('/product',productRoute)
// app.use('/salesmenu',salesmenuRoute)
// app.use('/production',productionRoute)
// app.use('/login',loginRoute)
// app.use('/expenses',expensesRoute)
// app.use('/promotion',promotionRoute)
// app.use('/setting',settingRoute)
// app.use('/pos',posRoute)
// app.use('/notification', notificationRoute);


// // Updateqtystock();


// app.get("/home",(req,res)=>{
//     res.json({message:"hello world!", pe:["taeyong","marklee","jaemin"]});
// });
// app.listen(PORT,()=>{
//     console.log(`Server started on port ${PORT}`);
// }) 
const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
const cors = require("cors");
const cookieSession = require('cookie-session');
require('dotenv').config();
const path = require('path');
const favicon = require('serve-favicon');

const app = express();
const PORT = process.env.PORT || 8080;
const frontUrl = process.env.FRONT;

// CORS settings
const corsOptions = {
    origin: [frontUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // เพิ่ม OPTIONS
    allowedHeaders: ['Content-Type', 'Authorization'], // เพิ่ม Authorization
};
app.use(cors(corsOptions));


// Cookie session settings
app.use(cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 3600 * 1000, // 1 hour
    secure: true,        // เพิ่ม
    sameSite: 'none'     // เพิ่ม
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = http.createServer(app);
app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

const setupSocket = require('./socket'); // เรียกใช้ไฟล์ socket.js
// setupSocket(server); // ตั้งค่า Socket.IO
const io = setupSocket(server); // ตั้งค่า Socket.IO และเก็บค่า io ในตัวแปร

// ทำให้ `io` ใช้ได้ในทุกที่โดยการเก็บไว้ใน app.locals
app.locals.io = io;

// Routes
const ownerRoute = require('./routes/owner');
const staffRoute = require('./routes/staff');
const ingredientRouter = require('./routes/ingredient');
const productRoute = require('./routes/product');
const salesmenuRoute = require('./routes/salesmenu');
const productionRoute = require('./routes/production');
const loginRoute = require('./routes/login');
const expensesRoute = require('./routes/expenses');
const promotionRoute = require('./routes/promotion');
const settingRoute = require('./routes/setting');
const notificationRouter = require('./routes/notification');
const posRoute = require('./routes/pos');
const dashRoute = require('./routes/dash');

const checkAndAddPrductNotificationsstock = require('./routes/notification').checkAndAddPrductNotificationsstock; // Import function
const checkAndAddIndNotificationsstock = require('./routes/notification').checkAndAddIndNotificationsstock; // Import function

app.use('/owner', ownerRoute);
app.use('/staff', staffRoute);
app.use('/ingredient', ingredientRouter.router);
app.use('/product', productRoute);
app.use('/salesmenu', salesmenuRoute);
app.use('/production', productionRoute);
app.use('/login', loginRoute);
app.use('/expenses', expensesRoute);
app.use('/promotion', promotionRoute);
app.use('/setting', settingRoute);
app.use('/notification', notificationRouter.router);
app.use('/pos',posRoute);
app.use('/dash',dashRoute);


setInterval(() => {
    checkAndAddPrductNotificationsstock(io);
    checkAndAddIndNotificationsstock(io);
    console.log('เรียกใช้ checkAndAddProductNotificationsStock')
}, 6000000); // 60000 มิลลิวินาที = 1 นาที

app.get("/", (req, res) => {
    // res.json({ message: "Hello!!, welcome This is the API hub for the SOFTDOUGH, CP-KKU project." });
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);});