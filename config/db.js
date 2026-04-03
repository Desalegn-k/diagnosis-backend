const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port : process.env.PORT,
});

module.exports = db;
