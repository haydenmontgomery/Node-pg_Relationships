const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//Returns a list of all invoices in the db
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({ invoices: results.rows });
    } catch(e) {
        return next(e);
    }
});

//returns the query of just the invoice by id
router.get('/:id', async (req, res, next) => {
    try {
        const {id} = req.params;
        const results = await db.query('SELECT * FROM invoices WHERE id=$1', [id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        return res.send({ invoice: results.rows[0] });
    } catch(e) {
        return next(e);
    }
});

//Create an invoice
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        if (!comp_code || ! amt){
            throw new ExpressError("Both company code and amount are required", 404);
        }
        const paid = false;

        const timestamp = Date.now();
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const add_date = `${year}-${month}-${day}`;
        
        const paid_date = null;

        const results = await db.query('INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) VALUES ($1, $2, $3, $4, $5) RETURNING comp_code, amt, paid, add_date, paid_date', [comp_code, amt, paid, add_date, paid_date]);
        return res.status(201).json({ invoice: results.rows[0] });
    } catch(e) {
        return next(e);
    }
});

//assignment asked for put request, not patch... either way, updates an invoice
router.put('/:id', async (req, res, next) => {
    try {
        const {id} = req.params;
        let { amt } = req.body;
        if (!amt) {
            throw new ExpressError("Amount is required", 404);
        }
/*         const testResults = await db.query('SELECT * FROM invoices WHERE id=$1', [id]);
        if(testResults.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        } */
        const results = await db.query('UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
        }
        return res.send({ invoice: results.rows[0] });
    } catch(e) {
        return next(e);
    }
});

//deletes an invoice from the db
router.delete('/:id', async (req, res, next) => {
    try {
        const results = db.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
        return res.send({ msg: "DELETED!"});
    } catch(e) {
        return next(e);
    }
});

module.exports = router;