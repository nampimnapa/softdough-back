const express = require("express");
const connection = require("./connection");
const app = express();
const PORT = 8080;
const cors = require("cors");

const cookieSession = require('cookie-session');
// const bcrypt = require('bcrypt');
// const { body, validationResult, Result } = require('express-validator');

// app.use(cors());
// app.use(express.urlencoded({extended: true}));
// app.use(express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 3600 * 1000 //hr
}));

//ลองอันใหม่
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
};

app.use(cors(corsOptions));


const ownerRoute = require('./routes/owner')
const staffRoute = require('./routes/staff')

// const {Updateqtystock,router:ingredientRoute} = require('./routes/ingredient')
const ingredientRoute = require('./routes/ingredient')
const productRoute = require('./routes/product')
const salesmenuRoute = require('./routes/salesmenu')
const productionRoute = require('./routes/production')
const loginRoute = require('./routes/login')
const expensesRoute = require('./routes/expenses')

// const { ifLoggedIn,ifNotLoggedIn, router: loginRoute } = require('./routes/login');

app.use('/owner',ownerRoute)
app.use('/staff',staffRoute)
app.use('/ingredient',ingredientRoute)
app.use('/product',productRoute)
app.use('/salesmenu',salesmenuRoute)
app.use('/production',productionRoute)
app.use('/login',loginRoute)
app.use('/expenses',expensesRoute)

// Updateqtystock();


app.get("/home",(req,res)=>{
    res.json({message:"hello world!", pe:["taeyong","marklee","jaemin"]});
});
app.listen(PORT,()=>{
    console.log(`Server started on port ${PORT}`);
}) 