const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

const db = new sqlite3.Database(
    path.join(__dirname, '../db/database.sqlite')
);

router.get('/', (req, res) => {

    db.all(
        'SELECT * FROM products',
        [],
        (err, products) => {

            res.render('products', {
                products
            });
        }
    );
});

module.exports = router;