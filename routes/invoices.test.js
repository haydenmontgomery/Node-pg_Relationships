process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

const formatDate = (date) => {
    return new Date(date).toISOString(); // Returns YYYY-MM-DD format
  };

beforeEach(async () => {
    const companyResult = await db.query(`INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'Test description') RETURNING code, name, description`);
    testCompany = companyResult.rows[0];
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('test', 100, true, '2023-05-09') RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = invoiceResult.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /invoices", () => {
    test("Get all invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [{
            "add_date": formatDate(testInvoice.add_date),
            "amt": testInvoice.amt,
            "comp_code": testInvoice.comp_code,
            "id": testInvoice.id,
            "paid": testInvoice.paid,
            "paid_date": formatDate(testInvoice.paid_date)
            }] 
        });
    });
});

describe("GET /invoices/:id", () => {
    test("Get a single invoice by their id", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: {
            "add_date": formatDate(testInvoice.add_date),
            "amt": testInvoice.amt,
            "comp_code": testInvoice.comp_code,
            "id": testInvoice.id,
            "paid": testInvoice.paid,
            "paid_date": formatDate(testInvoice.paid_date)
            }
        });
    });
    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    })
});

describe("POST /invoices", () => {
    test("Create a single invoice", async () => {
        const res = await request(app).post('/invoices').send({ comp_code: 'test', amt: 100 });
        const newInvoiceId = res.body.invoice.id;
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ invoice: {
            "add_date": formatDate(testInvoice.add_date),
            "amt": 100,
            "comp_code": testInvoice.comp_code,
            "id": newInvoiceId,//need actual id,
            "paid": false,
            "paid_date": null
            } 
        });
    });
});

describe("PUT /invoices/:id", () => {
    test("Edit a single invoice", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 200 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: {
            "add_date": formatDate(testInvoice.add_date),
            "amt": 200,
            "comp_code": testInvoice.comp_code,
            "id": testInvoice.id,
            "paid": testInvoice.paid,
            "paid_date": formatDate(testInvoice.paid_date)
            } 
        });
    });
    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).put(`/invoices/invalide`).send({ id: 'second', name: 'Second Invoice edit', description: 'Edited description' });
        expect(res.statusCode).toBe(404);
    })
});

describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ msg: 'DELETED!' });
    });
});
