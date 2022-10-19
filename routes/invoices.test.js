// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages - make sure we install this
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");