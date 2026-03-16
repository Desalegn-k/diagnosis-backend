const mysql = require("mysql2");

const db = mysql.createPool({
  // host: "localhost",
  // user: "diagnosis",
  // password: "123456",
  // database: "diagnosis_db",
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT,
});

module.exports = db;
