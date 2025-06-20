const express = require("express");
let client = require('../config/db.config')
let jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router()
require('dotenv').config();


router.post('/employee_login', async (req, res) => {
    const { email, password, id } = req.body;
    const user = (await client.query('SELECT * from employee WHERE email = $1', [email])).rows[0];
    // console.log(user.id);
    if (!user) {
        return res.json({ loginStatus: false, Error: "Wrong email or password" })
    }

    const isPasswordMatches = await bcrypt.compare(password, user.password);
    if (!isPasswordMatches) {
        return res.json({ loginStatus: false, Error: "Wrong email or password" })
    }
    // Generate JWT token
    const token = jwt.sign(
        { role: "user", email: email, id: user.id },
        process.env.ACCESS_TOKEN,
        // "dsjfbsdjkbsdjkdbgjsdbgjskbgjdsbgL",
        { expiresIn: "1d" }
    );
    // console.log(token, "log in successful")
    res.cookie('access_token', token, {
        httpOnly: true,
    })
    res.cookie('userid', user.id), {
        httpOnly: true
    }
    return res.json({ loginStatus: true, id: user.id })
    // }
})

router.get('/logout', (req, res) => {
    res.clearCookie('userid')
    res.clearCookie('access_token')
    return res.json({ Status: true })
})



router.post('/apply_leave/:id', (req, res) => {
    const eid = req.params.id;
    const { reason, startDate, endDate } = req.body;
    console.log(eid, reason, startDate, endDate);
    const leave = "INSERT INTO employee_leave (eid,reason,startDate,endDate) VALUES ($1, $2, $3, $4)"
    client.query(leave, [eid, reason, startDate, endDate], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error*******" })
        return res.json({ status: true })
    })
})
router.delete('/delete_leave/:token', (req, res) => {
    const token = req.params.token;
    console.log(token);
    const pg = `DELETE from employee_leave WHERE token = $1`
    client.query(pg, [token], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ status: true, Result: result })
    })
});


router.get('/applied_leave/:id', (req, res) => {
    const eid = req.params.id;
    // const query = "SELECT reason,status, TO_CHAR(startdate, 'DD/MM/YYYY') AS formatted_startdate, TO_CHAR(enddate, 'DD/MM/YYYY') AS formatted_enddate FROM employee_leave left join  WHERE eid = $1";
    const query = "select e.name, l.eid,l.token, l.reason,l.status,TO_CHAR(l.startdate, 'DD/MM/YYYY') AS formatted_startdate, TO_CHAR(l.enddate, 'DD/MM/YYYY') AS formatted_enddate FROM employee e right join employee_leave l on e.id = l.eid WHERE eid = $1";
    client.query(query, [eid], (err, result) => {
        // console.log(result.rows[0]) 
        if (err) return res.json({ status: false, Error: "Query error" })
        return res.json({ status: true, Result: result.rows })
    })
});

router.post('/attendence/:id', (req, res) => {
    const eid = req.params.id;
    const { date, inTime, outTime } = req.body;
    const query = "INSERT INTO attendence (eid,date, inTime,outTime) VALUES($1, $2, $3, $4)"
    client.query(query, [eid, date, inTime, outTime], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error*******" })
        return res.json({ status: true })
    })
});



module.exports = router;















