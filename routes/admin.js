const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 관리자 권한 검증 미들웨어
router.use((req, res, next) => {
    if (!req.session.user || req.session.user.username !== 'admin') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send('<script>alert("관리자만 접근할 수 있는 페이지입니다."); location.href="/";</script>');
    }
    next();
});

// 관리자 통합 대시보드
router.get('/', (req, res) => {
    db.all('SELECT username, name FROM users ORDER BY username ASC', [], (err1, users) => {
        db.all('SELECT * FROM products ORDER BY id DESC', [], (err2, products) => {

            const orderQuery = `
                SELECT orders.*, users.name AS user_real_name
                FROM orders
                         LEFT JOIN users ON TRIM(orders.username) = TRIM(users.username)
                ORDER BY orders.id DESC
            `;

            db.all(orderQuery, [], (err3, orders) => {
                if (err3) {

                    db.all('SELECT * FROM orders ORDER BY id DESC', [], (err4, fallbackOrders) => {
                        return res.render('admin', {
                            users: users || [],
                            products: products || [],
                            orders: fallbackOrders || [],
                            user: req.session.user
                        });
                    });
                } else {
                    res.render('admin', {
                        users: users || [],
                        products: products || [],
                        orders: orders || [],
                        user: req.session.user
                    });
                }
            });
        });
    });
});

// 상품 추가 등록 처리
router.post('/product/add', (req, res) => {
    const { name, price, image } = req.body;
    db.run(
        'INSERT INTO products (name, price, image) VALUES (?, ?, ?)',
        [name, parseInt(price), image || ''],
        (err) => {
            if (err) return res.send("商品 등록 실패");
            res.redirect('/admin');
        }
    );
});

// 상품 삭제 처리
router.get('/product/delete/:id', (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send("商品 삭제 실패");
        res.redirect('/admin');
    });
});

// 주문 상태 변경 처리

router.post('/order/update-status/:id', (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    db.run("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT '배송 대기'", [], (err) => {
        db.run(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, orderId],
            function(updateErr) {
                if (updateErr) {
                    console.error("❌ 관리자 주문 상태 변경 실패:", updateErr.message);
                    return res.send('<script>alert("상태 변경 중 오류가 발생했습니다."); history.back();</script>');
                }

                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.send(`
                    <script>
                        alert("🚚 주문 번호 #${orderId}의 상태가 [${status}]로 변경되었습니다!");
                        location.href = "/admin";
                    </script>
                `);
            }
        );
    });
});

// 관리자 주문 내역 실시간 삭제 처리
router.get('/order/delete/:id', (req, res) => {
    const orderId = req.params.id;

    db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
        if (err) {
            console.error("❌ 주문 내역 삭제 실패:", err.message);
            return res.send("주문 삭제 처리 중 오류가 발생했습니다.");
        }
        res.redirect('/admin');
    });
});

// 관리자 상품 정보 수정 처리 (이름, 가격, 이미지)
router.post('/product/edit/:id', (req, res) => {
    const productId = req.params.id;
    const { name, price, image } = req.body;

    db.run(
        'UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?',
        [name, parseInt(price), image, productId],
        function(err) {
            if (err) {
                console.error("❌ 상품 수정 실패:", err.message);
                return res.send("상품 수정 중 오류가 발생했습니다.");
            }
            res.redirect('/admin');
        }
    );
});

module.exports = router;