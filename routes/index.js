const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 상품 테이블이 없으면 생성
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT
        )
    `);

    db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO products (name, price, image) VALUES (?, ?, ?)");
            stmt.run("맥북 프로", 2500000, "https://dimg.donga.com/wps/NEWS/IMAGE/2021/12/09/110713388.1.jpg");
            stmt.run("아이폰", 1500000, "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black?wid=400&hei=400&fmt=jpeg&qlt=95&.v=1692923777972");
            stmt.run("아이패드", 1200000, "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-10th-gen-storage-select-202212-blue-wifi?wid=400&hei=400&fmt=jpeg&qlt=95&.v=1670857314545");
            stmt.run("에어팟", 300000, "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/airpods-pro-3-hero-select-202509_FMT_WHH?wid=752&hei=636&fmt=jpeg&qlt=90&.v=1758077264181");
            stmt.finalize();
            console.log("🛒 [알림] 메인 상품 4개 및 이미지 연동 DB 데이터 생성 완료!");
        }
    });
});
// 홈 화면 조회 구역
router.get('/', (req, res) => {
    // 전체 상품 가져오기
    db.all('SELECT * FROM products ORDER BY id DESC', [], (err1, products) => {
        if (err1) console.error("❌ 상품 조회 실패:", err1.message);

        // 로그인하지 않은 비회원인 경우, 무조건 빈 하트만 보여주도록 빈 배열 전달
        if (!req.session.user) {
            return res.render('index', {
                products: products || [],
                wishProductIds: [],
                user: null
            });
        }

        // 로그인 유저의 위시리스트
        const userId = req.session.user.username;
        db.all('SELECT product_id FROM wishlist WHERE user_id = ?', [userId], (err2, wishRows) => {
            if (err2) console.error("❌ 위시리스트 조회 실패:", err2.message);

            const wishProductIds = wishRows ? wishRows.map(row => row.product_id) : [];


            res.render('index', {
                products: products || [],
                wishProductIds: wishProductIds,
                user: req.session.user
            });
        });
    });
});


module.exports = router;
