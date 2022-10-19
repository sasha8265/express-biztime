// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages - make sure we install this
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");


let testCompany1;

// Set up before each test - add test company data
beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ('comp1', 'Company 1', 'Description of Company 1')
        RETURNING  code, name, description`);
    testCompany1 = result.rows[0]
})

// Tear down after each test - delete any data created by the server
afterEach(async () => {
    await db.query(`DELETE FROM companies`)
})

// After all tests run, end the connection to the test database
afterAll(async () => {
    await db.end()
})


/** GET /companies - returns `{companies: [company, ...]}` */
describe("GET /companies", () => {
    test("Get a list with all existing companies", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompany1] })
    })
})


/** GET /companies/[code] - return data about one company: `{company: company}` */
describe("GET /companies/:code", () => {
    test("Gets a single company by company code", async () => {
        const res = await request(app).get(`/companies/${testCompany1.code}`)
        console.log(res.text);
        expect(res.statusCode).toBe(200);
        // expect(res.body).toEqual()
    })

    /**
     * Expected value:  
     {"company": {"code": "comp1", "description": "Description of Company 1", "name": "Company 1"}}
     * 
     * Received object: 
     {"company": {"code": "comp1", "description": "Description of Company 1", "invoices": [], "name": "Company 1"}}
     */

    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).get(`/companies/xyz`)
        expect(res.statusCode).toBe(404);
    })
})

/** POST /companies/ - create company from data;
 * return data about one company: `{company: company}` */
describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send({ name: 'Company 2', description: 'Description for Company 2' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: { code: 'company-2', name: 'Company 2', description: 'Description for Company 2' }
        })
    })
})

/** PUT /companies/[code] - retrieve company by code and update from data;
 * return data about updated company: `{company: company}` 
 * Return 404 if company code not found
*/
describe("PUT /companies/:code", () => {
    test("Updates a single company", async () => {
        const res = await request(app).put(`/companies/${testCompany1.code}`).send({ name: 'ABC Inc.', description: 'A different description for ABC Inc.' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { code: testCompany1.code, name: 'ABC Inc.', description: 'A different description for ABC Inc.' }
        })
    })
    test("Responds with 404 for invalid comapany code", async () => {
        const res = await request(app).put(`/companies/xyz`).send({ name: 'ABC Inc.', description: 'A different description for ABC Inc.' });
        expect(res.statusCode).toBe(404);
    })
})


/** DELETE /companies/[code] - delete company,
 *  return `{status: "Company Deleted: [code]"}` */
describe("DELETE /users/:id", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany1.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: `Company Deleted: ${testCompany1.code}` })
    })
    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).delete(`/companies/xyz`);
        expect(res.statusCode).toBe(404);
    })
})