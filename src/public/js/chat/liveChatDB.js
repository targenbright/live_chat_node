
/**
 * Exports the real database connection pool
 * @module db */

 const mysql = require("mysql2");

 // TODO: establish config file to keep credentials out of code
 //const config = require("../config");
 
 /* Create a connection to database. */
 var database = mysql.createPool({
         host: process.env.MYSQL_HOST,
         port: process.env.MYSQL_PORT,
         user: process.env.MYSQL_USER,
         password: process.env.MYSQL_PASS,
         database: 'LiveChat'
 });
 
 /** Database connection */
 module.exports = database;
 