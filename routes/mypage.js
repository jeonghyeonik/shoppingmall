const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 마이페이지 대시보드 조회
router.get('/', (req, res) => {
    // 로그인이 안 되어 있으면 로그인 페이지로 강제 리다이렉트
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    const userId = req.session.user.username;

    // 유저의 주문 내역 조회
    db.all('SELECT * FROM orders WHERE username = ? OR user_id = ? ORDER BY id DESC', [userId, userId], (err1, orders) => {
        if (err1) console.error("❌ 주문 조회 실패:", err1.message);

        // 찜한 상품의 상세 정보
        const wishQuery = `
            SELECT wishlist.product_id, products.name, products.price, products.image 
            FROM wishlist 
            JOIN products ON wishlist.product_id = products.id 
            WHERE wishlist.user_id = ?
            ORDER BY wishlist.id DESC
        `;

        db.all(wishQuery, [userId], (err2, wishItems) => {
            if (err2) console.error("❌ 위시리스트 조회 실패:", err2.message);


            res.render('mypage', {
                orders: orders || [],
                wishItems: wishItems || [],
                user: req.session.user
            });
        });
    });
});


router.get('/wish/:productId', (req, res) => {
    if (!req.session.user) {
        return res.send('<script>alert("로그인이 필요합니다."); location.href="/user/login";</script>');
    }

    const userId = req.session.user.username;
    const productId = req.params.productId;

    db.get('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId], (err, row) => {
        if (row) {
            // 이미 존재하면 위시리스트에서 해제 (DELETE)
            db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId], () => {

                return res.send('<script>alert("💔 위시리스트에서 제거되었습니다."); location.href="/mypage";</script>');
            });
        } else {
            // 없으면 위시리스트에 신규 추가 (INSERT)
            const createdAt = new Date().toLocaleString();
            db.run('INSERT INTO wishlist (user_id, product_id, created_at) VALUES (?, ?, ?)', [userId, productId, createdAt], () => {
                // 홈 화면에서 하트를 눌렀을 때는 원래대로 홈 화면으로 복귀
                return res.send('<script>alert("❤️ 위시리스트에 담겼습니다!"); location.href="/";</script>');
            });
        }
    });
});

// 회원의 주문취소(삭제) 처리 기능
router.get('/order/cancel/:id', (req, res) => {
    // 로그인 체크
    if (!req.session.user) {
        return res.send('<script>alert("로그인이 필요합니다."); location.href="/user/login";</script>');
    }

    const orderId = req.params.id;

    // 데이터베이스 orders 테이블에서 해당 주문 내역을 완전히 제거
    db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
        if (err) {
            console.error("❌ 주문 취소 실패:", err.message);
            return res.send('<script>alert("주문 취소 중 오류가 발생했습니다."); location.href="/mypage";</script>');
        }

        // 성공 시 알림창을 띄우고 다시 마이페이지로 복귀
        return res.send('<script>alert("🗑️ 주문이 정상적으로 취소되었습니다."); location.href="/mypage";</script>');
    });
});
module.exports = router;