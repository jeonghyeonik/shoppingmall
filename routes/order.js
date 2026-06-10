const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);


router.post('/complete', (req, res) => {

    const userId = req.session.user ? req.session.user.username : 'guest';


    const { product_name, amount, merchant_uid } = req.body;
    const createdAt = new Date().toLocaleString();

    // 영수증 화면용 세션 데이터 탑재
    req.session.lastOrder = {
        merchant_uid: merchant_uid || ("ORD-" + Date.now()),
        product_name: product_name || "주문 상품",
        amount: amount || 0
    };

    // orders 테이블의 컬럼 정렬
    const insertQuery = `
        INSERT INTO orders (user_id, username, product_name, price, quantity, status) 
        VALUES (?, ?, ?, ?, 1, '결제 완료')
    `;


    db.run(insertQuery, [userId, userId, product_name, amount], function(err) {
        if (err) {
            console.error("❌ 진짜 DB 기록 에러:", err.message);
        } else {
            console.log("🎉 [성공] 주문 데이터가 orders 테이블에 완벽하게 저장되었습니다! ID:", this.lastID);
        }

        db.run('DELETE FROM cart_items WHERE user_id = ?', [userId], (deleteErr) => {
            if (deleteErr) console.error("❌ 장바구니 비우기 실패:", deleteErr.message);


            res.json({ success: true });
        });
    });
});

router.get('/success', (req, res) => {

    const orderInfo = req.session.lastOrder || { merchant_uid: "ORD-SAMPLE", product_name: "결제 상품", amount: 0 };
    delete req.session.lastOrder;


    res.render('order_suc', {
        order: orderInfo,
        user: req.session.user || { username: '고객', id: 'guest' }
    });
});

module.exports = router;