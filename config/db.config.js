const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,


    // host: 'localhost',
    // port: 5432,
    // database: 'employeems',
    // user: 'postgres',
    // password: 'postgres',

    // host: 'localhost',
    // port: 3306,
    // database: 'vedartso_employeelv',
    // user: 'vedartso_employee',
    // password: 'Vedart#9999',
})

client.connect((err) => {
    if (err) {
        console.log('connection error', err.stack)
    } else {
        console.log('connected')
    }
})
module.exports = client;




