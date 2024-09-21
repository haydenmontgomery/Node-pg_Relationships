process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'Test description') RETURNING code, name, description`);
    testCompany = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Get all companies", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompany] });
    });
});

describe("GET /companies/:code", () => {
    test("Get a single company by their code", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: testCompany, invoices: [] });
    });
    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).get(`/companies/invalid`);
        expect(res.statusCode).toBe(404);
    })
});

describe("Post /companies", () => {
    test("Create a single company", async () => {
        const res = await request(app).post('/companies').send({ code: 'second', name: 'Second Company', description: 'Second test company description' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ company: { code: 'second', name: 'Second Company', description: 'Second test company description'} });
    });
});

describe("PUT /companies/:code", () => {
    test("Edit a single company", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({ code: 'test', name: 'Test Company edit', description: 'Edited description' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: { code: 'test', name: 'Test Company edit', description: 'Edited description'} });
    });
    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).put(`/companies/invalide`).send({ code: 'second', name: 'Second Company edit', description: 'Edited description' });
        expect(res.statusCode).toBe(404);
    })
});

describe("DELETE /companies/:code", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ msg: 'DELETED!' });
    });
});
