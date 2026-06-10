const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/database.sqlite');

const products = [
    ['맥북 프로', '노트북', 2500000],
    ['아이폰', '스마트폰', 1500000],
    ['에어팟', '이어폰', 300000],
    ['아이패드', '태블릿', 1200000]
];

products.forEach(product => {

    db.run(
        'INSERT INTO products(name, description, price) VALUES(?,?,?)',
        product
    );
});

console.log('상품 등록 완료');

db.close();