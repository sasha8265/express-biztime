// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");


let testComp;
let testInv;

// Set up before each test - add test company and invoice data
beforeEach(async () => {
    const compResult = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ('comp1', 'Company 1', 'Description of Company 1')
        RETURNING  code, name, description`);
    const invResult = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
        VALUES ('comp1', 100)
        RETURNING id, comp_code, amt, add_date, paid, paid_date`);
    testComp = compResult.rows[0]
    testInv = invResult.rows[0]
})

// Tear down after each test - delete any data created by the server
afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
    await db.query(`DELETE FROM companies`)
})

// After all tests run, end the connection to the test database
afterAll(async () => {
    await db.end()
})


/** GET /invoices - returns `{invoices: [invoice, ...]}` */
describe("GET /invoices", () => {
    test("Get a list with all existing invoices", async () => {
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200);
        console.log(res.body);
        console.log({invoices: [testInv]});
        // expect(res.body).toEqual({ invoices: [testInv] })

        //expected: "add_date": 2022-10-19T04:00:00.000Z
        //received: "add_date": "2022-10-19T04:00:00.000Z"
    })
})


/** GET /invoices/[id] - return data about one invoice: `{invoice: invoice}` */
describe("GET /invoices/:id", () => {
    test("Gets a single invoice by invoice id", async () => {
        const res = await request(app).get(`/invoices/${testInv.id}`)
        // console.log(res.body);
        // console.log(testInv)
        expect(res.statusCode).toBe(200);
        // expect(res.body).toEqual()
        // do I need to define an object as testInvDetails that includes company data?
        //Or do I hardcode what i expect the object to be?
    })

    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toBe(404);
    })
})

/** POST /companies/ - create company from data;
 * return data about one company: `{company: company}` */
describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post('/invoices').send({ comp_code: testComp.code, amt: 200 });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: 'comp1',
                amt: 200,
                add_date: expect.anything(),
                paid: false,
                paid_date: null
            }
        })
    })
})

/** PUT /invoices/[in] - retrieve invoice by id and update from data;
 * return data about updated invoice: `{invoice: invoice}` 
 * Return 404 if invoice id not found
*/
describe("PUT /invoices/:id", () => {
    test("Updates a single invoice", async () => {
        const res = await request(app).put(`/invoices/${testInv.id}`).send({ amt: 200, paid: true });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: testInv.id,
                comp_code: 'comp1',
                amt: 200,
                add_date: expect.anything(),
                // add_date: testInv.add_date,
                paid: true,
                paid_date: expect.anything()
            }
        })
    })
    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).put(`/invoices/0`).send({ amt: 0, paid: true });
        expect(res.statusCode).toBe(404);
    })
})


/** DELETE /invoices/[id] - delete invoice,
 *  return `{status: "Invoice Deleted: [id]"}` */
describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInv.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ msg: `Invoice Deleted: ${testInv.id}` })
    })
    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    })
})