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

const app = express();
const PORT = 8080;

// CORS settings
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Cookie session settings
app.use(cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 3600 * 1000 // 1 hour
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

// const { checkMinimumIngredient, queryAsync } = require('./routes/notification');
const { checkMinimumIngredient } = require('./routes/notification');

// ส่ง io ไปในฟังก์ชันนี้
// checkMinimumIngredient(io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const userId = socket.handshake.query.userId;

    const getUnreadNotifications = async (userId) => {
        const query = `
            SELECT * FROM notification
            WHERE user_id LIKE ? AND (read_id IS NULL OR read_id NOT LIKE ?)
        `;
        const results = await queryAsync(query, [`%${userId}%`, `%${userId}%`]);
        return results;
    };

    socket.on('getNotificationCount', async () => {
        const unreadNotifications = await getUnreadNotifications(userId);
        // checkMinimumIngredient(io);
        socket.emit('notificationCount', unreadNotifications.length);
        console.log('Notification count:', unreadNotifications.length);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

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
const posRoute = require('./routes/pos')

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
app.use('/pos',posRoute)

app.get("/", (req, res) => {
    res.json({ message: "hello world!" });
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);});
