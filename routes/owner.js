
//ไม่ใช้
const express = require("express");
const connection = require("../connection");
const router = express.Router();

router.post('/add',(req,res,next)=>{
    let owner = req.body;
    query = "insert into owner (own_username,own_password,own_name) values(?,?,?)";
    connection.query(query, [owner.own_username, owner.own_password, owner.own_name], (err, results) => {
        if (!err) {
            return res.status(200).json({ message: "success" });
        } else {
            console.error("MySQL Error:", err);
            return res.status(500).json({ message: "error", error: err });
        }
    });      
})

router.get('/read',(req,res,next)=>{ 
    var query = 'select *from owner'
    connection.query(query,(err,results)=>{
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });    
})

router.patch('/update/:own_id', (req, res, next) => {
    const own_id = req.params.own_id;
    const owner = req.body;
    var query = "UPDATE owner SET own_username=?, own_password=?, own_name=? WHERE own_id=?";
    connection.query(query, [owner.own_username, owner.own_password, owner.own_name, own_id], (err, results) => {
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
});

module.exports = router;