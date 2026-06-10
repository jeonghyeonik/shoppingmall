const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,       
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1
        )
    `, (err) => {
        if (err) console.error("❌ cart_items 테이블 생성 실패:", err.message);
    });
});

// 장바구니 담기
router.get('/add/:id', function(req, res) {
    if (!req.session.user) {
        return res.render('login_required', {
            message: '장바구니 담기 위해서는 로그인이 필요합니다.',
            redirectUrl: '/user/login'
        });
    }

    const userId = req.session.user.username; // 마이페이지와 일치하도록 username 기준 식별
    const productId = req.params.id;

    // 장바구니 중복 여부 확인
    db.get(
        'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
        [userId, productId],
        (err, row) => {
            if (err) {
                console.error("장바구니 조회 중 오류:", err.message);
                return res.send('장바구니 담기 실패');
            }

            if (row) {
                // 이미 장바구니에 있다면 수량만 증가 (UPDATE)
                db.run(
                    'UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?',
                    [userId, productId],
                    function(updateErr) {
                        if (updateErr) return res.send('장바구니 수량 변경 실패');
                        return res.redirect('/cart');
                    }
                );
            } else {
                // 장바구니에 없는 상품이면 새로 추가 (INSERT)
                db.run(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)',
                    [userId, productId],
                    function(insertErr) {
                        if (insertErr) return res.send('장바구니 추가 실패');
                        return res.redirect('/cart');
                    }
                );
            }
        }
    );
});

// 장바구니 조회
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    const userId = req.session.user.username;

    db.all(
        `
            SELECT
                cart_items.product_id,
                cart_items.quantity,
                products.name,
                products.price
            FROM cart_items
            JOIN products ON cart_items.product_id = products.id
            WHERE cart_items.user_id = ?
        `,
        [userId],
        (err, items) => {
            if (err) {
                console.error("장바구니 조회 에러:", err);
                return res.send('조회 실패');
            }

            // 총 금액 계산
            let total = 0;
            if (items) {
                items.forEach(item => {
                    total += item.price * item.quantity;
                });
            }

            res.render('cart', {
                items: items,
                total: total,
                user: req.session.user
            });
        }
    );
});

// 장바구니 수량 조절
router.get('/update/:productId/:action', function(req, res) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    const userId = req.session.user.username;
    const productId = req.params.productId;
    const action = req.params.action;

    if (action === 'increase') {
        db.run(
            'UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?',
            [userId, productId],
            function(err) {
                if (err) return res.send('수량 변경 실패');
                res.redirect('/cart');
            }
        );
    } else if (action === 'decrease') {
        db.run(
            'UPDATE cart_items SET quantity = quantity - 1 WHERE user_id = ? AND product_id = ? AND quantity > 1',
            [userId, productId],
            function(err) {
                if (err) return res.send('수량 변경 실패');
                res.redirect('/cart');
            }
        );
    }
});

// 장바구니 상품 삭제 처리
router.get('/delete/:productId', function(req, res) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    const userId = req.session.user.username;
    const productId = req.params.productId;

    db.run(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
        [userId, productId],
        function(err) {
            if (err) return res.send('상품 삭제 실패');
            res.redirect('/cart');
        }
    );
});

// 주문 완료 처리
router.get('/order', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }

    const userId = req.session.user.username;

    db.all(
        `SELECT cart_items.product_id, cart_items.quantity, products.price, products.name
         FROM cart_items
                  JOIN products ON cart_items.product_id = products.id
         WHERE cart_items.user_id = ?`,
        [userId],
        (err, items) => {
            if (err || !items || items.length === 0) {
                return res.send('주문할 상품이 없습니다.');
            }

            let total = 0;
            items.forEach(item => {
                total += item.price * item.quantity;
            });

            let completedInserts = 0;
            const createdAt = new Date().toLocaleString();

            items.forEach(item => {

                db.run("ALTER TABLE orders ADD COLUMN created_at TEXT", [], () => {
                    db.run("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT '배송 대기'", [], () => {
                        db.run("ALTER TABLE orders ADD COLUMN username TEXT", [], () => {


                            db.run(
                                `INSERT INTO orders (user_id, username, product_name, price, quantity, created_at, status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [userId, userId, item.name, item.price, item.quantity, createdAt, '배송 대기'],
                                (insertErr) => {
                                    if (insertErr) {

                                        db.run(
                                            `INSERT INTO orders (user_id, product_name, price, quantity) VALUES (?, ?, ?, ?)`,
                                            [userId, item.name, item.price, item.quantity]
                                        );
                                    }

                                    completedInserts++;

                                    if (completedInserts === items.length) {
                                        // 장바구니 비우기 및 화면 렌더링
                                        db.run('DELETE FROM cart_items WHERE user_id = ?', [userId], (deleteErr) => {
                                            res.render('order', {
                                                items: items,
                                                total: total,
                                                user: req.session.user
                                            });
                                        });
                                    }
                                }
                            );

                        });
                    });
                });
            });
        }
    );
});

module.exports = router;