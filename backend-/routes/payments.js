const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db'); 

const sql = require('mssql');

router.get('/revenue-by-type', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT m.membershipType, SUM(amount) as totalRevenue 
                FROM Payment as p 
                JOIN gymUser as m ON m.userId = p.memberId
                WHERE p.status = 'Completed' 
                GROUP BY m.membershipType
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/monthly-revenue', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT YEAR(p.paymentDate) as Year, MONTH(p.paymentDate) as Month, 
                       m.membershipType, SUM(p.amount) as totalRevenue 
                FROM Payment as p 
                JOIN gymUser AS m ON m.userId = p.memberId
                WHERE p.paymentDate >= DATEADD(MONTH, -6, EOMONTH(GETDATE())) 
                AND p.status = 'Completed'
                GROUP BY YEAR(p.paymentDate), MONTH(p.paymentDate), m.membershipType
                ORDER BY Year ASC, Month ASC, m.membershipType
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/process', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { memberId, amount, paymentDate, status } = req.body;

        const result = await pool.request()
            .input('memberId', sql.Int, memberId)
            .input('amount', sql.Decimal(10,2), amount)
            .input('paymentDate', sql.Date, paymentDate)
            .input('status', sql.VarChar(20), status || 'Completed')
            .execute('ProcessPayment');

        res.json({ message: 'Payment processed successfully', output: result.output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/pending', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT paymentId, memberId, fName, lName, amount, paymentDate 
                FROM pendingPayments
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;