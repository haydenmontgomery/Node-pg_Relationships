const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//Returns a list of all companies in the db
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows });
    } catch(e) {
        return next(e);
    }
});

//returns the query of just the company by code
router.get('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const first_results = await db.query('SELECT * FROM companies WHERE code=$1', [code]);
        if(first_results.rows.length === 0) {
            throw new ExpressError(`Can't find companies with code of ${code}`, 404);
        }
        const second_results = await db.query('SELECT * FROM invoices WHERE comp_code=$1', [code]);
        return res.send({ 
            company: first_results.rows[0],
            invoices: second_results.rows
        });
    } catch(e) {
        return next(e);
    }
});

//creates a company
router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: results.rows[0] });
    } catch(e) {
        return next(e);
    }
});

//assignment asked for put request, not patch... either way, updates a company
router.put('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404);
        }
        return res.send({ company: results.rows[0] });
    } catch(e) {
        return next(e);
    }
});

//deletes a company from the db
router.delete('/:code', async (req, res, next) => {
    try {
        const results = db.query('DELETE FROM companies WHERE code=$1', [req.params.code]);
        return res.send({ msg: "DELETED!"});
    } catch(e) {
        return next(e);
    }
});

module.exports = router;