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
        const id = req.params.id;
        const { amt, paid } = req.body;
        let paidDate = null;

        const findInv = await db.query(
            `SELECT paid FROM invoices WHERE id = $1`, [id]
        );

        if (findInv.rows.length === 0) {
            throw new ExpressError(`No invoice found: ${id}`, 404)
        }

        const currPaidDate = findInv.rows[0].paid_date;

        // if existing paid date is null but paid is true, add todays's date
        if (!currPaidDate && paid) {
            paidDate = new Date();
            // if paid is false, set paid date to null
        } else if (!paid) {
            paidDate = null
            // otherwise keep paid_date the same
        } else { 
            paidDate = currPaidDate
        }

        const result = await db.query(
            `UPDATE invoices 
            SET amt=$1, paid=$2, paid_date=$3 
            WHERE id=$4
            RETURNING id, comp_code, amt, add_date, paid, paid_date`, [amt, paid, paidDate, id])
        
        return res.json({ "invoice": result.rows[0] });

    } catch (e) {
        return next(e)
    }
});


router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [id])
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice id cannot be found: ${id}`, 404)
        }
        return res.json({ msg: `Invoice Deleted: ${id}` })
    } catch (e) {
        return next(e)
    }
});



module.exports = router;