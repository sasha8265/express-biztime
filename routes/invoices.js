const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({ invoices: results.rows })
    } catch (e) {
        return next(e)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await db.query(
            `SELECT i.id,
             i.comp_code,
             i.amt,
             i.paid,
             i.add_date,
             i.paid_date,
             c.name,
             c.description
            FROM invoices as i
            INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        const data = result.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: { code: data.comp_code, name: data.name, description: data.description }
        }
        return res.json({ "invoice": invoice });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, add_date, paid, paid_date`, [comp_code, amt]);
        
        return res.status(201).json({ "invoice": result.rows[0] });
    } catch (e) {
        next(e)
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;

        const result = await db.query(
            `UPDATE invoices 
            SET amt=$1 
            WHERE id=$2
            RETURNING id, comp_code, amt, add_date, paid, paid_date`, [amt, id])
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update invoice: ${id}`, 404)
        }
        return res.json({ "invoice": result.rows[0] });
    } catch (e) {
        next(e)
    }
});



module.exports = router;