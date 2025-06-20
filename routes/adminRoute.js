const express = require("express");
const router = express.Router();
let client = require('../config/db.config')
let jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
require('dotenv').config();



router.post('/adminlogin', async (req, res) => {
    const { email, password, id } = req.body;

    const sql = 'SELECT * from admin where email = $1 AND password = $2';
    const { rows } = await client.query(sql, [email, password]);

    if (rows.length > 0) {
        // Generate JWT token
        const token = jwt.sign(
            { role: "admin", email: email, id: rows[0].id },
            process.env.ACCESS_TOKEN,
            // "dsjfbsdjkbsdjkdbgjsdbgjskbgjdsbgL",
            { expiresIn: "1d" }
        );
        // console.log(token, "log in successful")
        res.cookie('access_token', token)
        return res.json({ loginStatus: true })
    } else {
        return res.json({ loginStatus: false, Error: "Wrong email or password" })
    }
});



router.post('/add_category', (req, res) => {
    const { category } = req.body; // Assuming you are sending data in the request body
    // console.log(category)
    const sql = "INSERT INTO category (name) VALUES ($1)"
    client.query(sql, [category], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" })
        return res.json({ status: true })
    })
})

// IMAGE UPLOAD
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Public/Images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

router.post('/add_employee', upload.single('image'), (req, res) => {
    // const {name, email,address}  = req.body;
    console.log(req.file.filename)
    const emp = "INSERT INTO employee (name,email,password,salary,address,image,category_id) VALUES ($1, $2, $3, $4, $5, $6, $7)"
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) return res.json({ status: false, Error: "Query error" })
        const values = [
            req.body.name,
            req.body.email,
            hash,
            req.body.salary,
            req.body.address,
            req.file.filename,
            req.body.category_id
        ];
        client.query(emp, values, (err, result) => {
            if (err) return res.json({ status: false, Error: "Query error*******" })
            return res.json({ status: true })
        })
    })
})

router.get('/category', (req, res) => {
    const sql = "SELECT * FROM category";
    client.query(sql, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" })
        res.send("categories");
        return res.json({ status: true, Result: result.rows })
    })
})

router.get('/employee/:id', (req, res) => {
    const id = req.params.id;
    // console.log(id)
    const query = "SELECT e.id,e.name,e.address,e.image,e.salary,e.email,e.category_id, c.name as categoryname FROM employee e left join category c on e.category_id = c.id WHERE e.id = $1";
    client.query(query, [id], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" })
        return res.json({ status: true, Result: result.rows })
    })
})

router.get('/employee', (req, res) => {
    // const query = "SELECT * FROM employee";
    const query = "select e.id, e.name, e.image, e.email, e.address, e.salary,e.category_id,c.name as categoryname from employee e left join category c on category_id = c.id";
    client.query(query, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" })
        return res.json({ status: true, Result: result.rows })
    })
})

router.put('/edit_employee/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { name, email, salary, address, category_id } = req.body;
    const image = req.file ? req.file.filename : null;

    let query = `
        UPDATE employee
        SET name = $1, email = $2, salary = $3, address = $4, category_id = $5
        ${image ? `, image = $6` : ``}
        WHERE id = $${image ? 7 : 6}
    `;
    const values = image
        ? [name, email, salary, address, category_id, image, id]
        : [name, email, salary, address, category_id, id];

    client.query(query, values, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error: " + err });
        return res.json({ status: true, Result: result });
    });
});

router.delete('/delete_employee/:id', (req, res) => {
    const id = req.params.id;
    const pg = `DELETE from employee WHERE id = $1`
    client.query(pg, [id], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ status: true, Result: result })
    })
});
router.delete('/delete_category/:id', (req, res) => {
    const id = req.params.id;
    const pg = `DELETE from category WHERE id = $1`
    client.query(pg, [id], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ status: true, Result: result })
    })
});

router.get('/applied_leave', (req, res) => {
    // const query = "SELECT reason,status, TO_CHAR(startdate, 'DD/MM/YYYY') AS formatted_startdate, TO_CHAR(enddate, 'DD/MM/YYYY') AS formatted_enddate FROM employee_leave left join  WHERE eid = $1";
    const query = "select e.name,l.token, l.eid,l.reason,l.status,TO_CHAR(l.startdate, 'DD/MM/YYYY') AS formatted_startdate, TO_CHAR(l.enddate, 'DD/MM/YYYY') AS formatted_enddate FROM employee e right join employee_leave l on e.id = l.eid ";
    client.query(query, (err, result) => {
        // console.log(result.rows[0]) 
        if (err) return res.json({ status: false, Error: "Query error" })
        return res.json({ status: true, Result: result.rows })
    })
});


router.put('/approveLeave/:token', (req, res) => {
    const token = req.params.token;
    console.log(token);
    const pg = `UPDATE employee_leave set status = $1 WHERE token = $2`;
    client.query(pg, ['Approved', token], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ status: true, Result: result })
    })
});
router.put('/rejectLeave/:token', (req, res) => {
    const token = req.params.token;
    console.log(token);
    const pg = `UPDATE employee_leave set status = $1 WHERE token = $2`;
    client.query(pg, ['Rejected', token], (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ status: true, Result: result })
    })
});

router.get('/admin_count', (req, res) => {
    const sql = "select count(id) as admin from admin";
    client.query(sql, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ Status: true, Result: result.rows })
    })
})

router.get('/employee_count', (req, res) => {
    const sql = "select count(id) as employee from employee";
    client.query(sql, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ Status: true, Result: result.rows })
    })
})

router.get('/salary_count', (req, res) => {
    const sql = "select sum(salary) as salary from employee";
    client.query(sql, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ Status: true, Result: result.rows })
    })
})
router.get('/category_count', (req, res) => {
    const sql = "select count(id) as category from category";
    client.query(sql, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ Status: true, Result: result.rows })
    })
})

router.get('/admins', (req, res) => {
    const sql = "select * from admin";
    client.query(sql, (err, result) => {
        if (err) return res.json({ status: false, Error: "Query error" + err })
        return res.json({ Status: true, Result: result.rows })
    })
})

router.get('/logout', (req, res) => {
    res.clearCookie('access_token')
    return res.json({ Status: true })
})

module.exports = router;
