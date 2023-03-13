const Pool = require("pg").Pool;

const { DB_NAME, DB_PASSWD, DB_USER } = process.env;

module.exports = new Pool({
    user: DB_USER,
    host: "localhost",
    database: DB_NAME,
    password: DB_PASSWD,
    port: 5432,
});
