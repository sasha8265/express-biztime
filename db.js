/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
    DB_URI = "postgresql:///users_test";
    //Lets us use a separate database for testing
} else {
    DB_URI = "postgresql:///users";
}

let db = new Client({
    connectionString: DB_URI
    //tells node where the database is so it can connect to it 
});

db.connect();
//starts up the connection

module.exports = db;