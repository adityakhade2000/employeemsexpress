const express = require('express');
const cors = require('cors');
var cookieParser = require('cookie-parser');
require('dotenv').config();

const port = process.env.HOST_PORT || 3333
var jwt = require('jsonwebtoken');
var adminRouter = require('./routes/adminRoute')
var employeeRouter = require('./routes/employeeRoute')


const app = express();

app.use(cors({
    origin: process.env.FORNTEND_HOST_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}))


app.use(cookieParser())
app.use(express.json())
// app.use(express.urlencoded({extends:false}))
app.use('/auth', adminRouter)
app.use('/employee', employeeRouter)

app.use(express.static('Public'))

const verifyUser = (req, res, next) => {
    const token = req.cookies.access_token;
    // console.log('cookies',token);
    if (token) {
        jwt.verify(token, "dsjfbsdjkbsdjkdbgjsdbgjskbgjdsbgL", (err, decoded) => {
            if (err) return res.json({ Status: false, Error: "Wrong token" })
            req.id = decoded.id;
            req.role = decoded.role;
            return next();
        })
    } else {
        return res.json({ Status: false, Error: "Not Autheticated" })
    }
}
app.get('/verify', verifyUser, (req, res) => {
    return res.json({ Status: true, role: req.role, id: req.id })
})

app.listen(port, () => {
    console.log('server listening on port 3000')
})

app.get('/', (req, res) => {
    res.send('Hello from our server!')
})
