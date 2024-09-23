const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get('/', async (req, res, next) => {
    try {
        let industriesWithCompanies = [];
        const results = await db.query(`SELECT * FROM industries`);
        for (let industry of results.rows){
            let indResults = await db.query(`
                SELECT c.name 
                FROM companies AS c
                LEFT JOIN companies_industries AS ci
                ON ci.comp_code = c.code
                LEFT JOIN industries AS i
                ON i.code = ci.industry_code
                WHERE i.code=$1
                `, [industry.code]);
            industriesWithCompanies.push({
                code: industry.code,
                industry: industry.industry,
                companies: indResults.rows.map(c => c.name)
            })
        }
        return res.json({ industries: industriesWithCompanies });
    } catch(e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const results = await db.query('INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);
        return res.status(201).json({ industry: results.rows[0] });
    } catch(e) {
        return next(e);
    }
});

router.post('/:code', async (req, res, next) => {
    try {
        let { code: compCode } = req.body;
        let { code } = req.params;
        const results = await db.query(`INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING comp_code, industry_code`, [compCode, code]);
        return res.status(201).json({ companies_industries: results.rows[0] })
    } catch(e) {
        return next(e);
    }
})

module.exports = router;