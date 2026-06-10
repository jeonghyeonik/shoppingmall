const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 회원가입 페이지
router.get('/register', (req, res) => {
    res.render('register');
});

// 회원가입 처리
router.post('/register', async (req, res) => {
    const { username, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        'INSERT INTO users(username,password,name) VALUES(?,?,?)',
        [username, hashedPassword, name],
        (err) => {
            if (err) {
                console.log(err.message);
                return res.send('회원가입 실패');
            }
            res.redirect('/user/login');
        }
    );
});

// 로그인 페이지
router.get('/login', (req, res) => {
    res.render('login');
});

// 로그인 처리
// 로그인 처리
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        'SELECT * FROM users WHERE username=?',
        [username],
        async (err, user) => {
            if (err || !user) {
                return res.render('login_failed');
            }

            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.user = user;
                res.redirect('/');
            } else {
                // 브라우저의 가로채기 방지를 위해 상태 코드를 제외하고 렌더링 진행
                res.render('login_failed');
            }
        }
    );
});

// 로그아웃
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 회원탈퇴 처리
router.get('/delete-account', function(req, res) {
    // 로그인 상태 체크
    if (!req.session.user) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send('<script>alert("로그인이 필요한 서비스입니다."); location.href="/user/login";</script>');
    }

    const currentUsername = req.session.user.username;

    // 데이터베이스에서 해당 유저 삭제
    db.run('DELETE FROM users WHERE username = ?', [currentUsername], function(err) {
        if (err) {
            console.error("회원탈퇴 DB 삭제 실패:", err.message);
            return res.send("회원탈퇴 처리 중 오류가 발생했습니다.");
        }

        // 세션 파기
        req.session.destroy(function(err2) {
            if (err2) {
                console.error("세션 파기 오류:", err2);
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send('<script>alert("회원탈퇴가 정상적으로 완료되었습니다. 그동안 이용해 주셔서 감사합니다."); location.href="/";</script>');
        });
    });
});

module.exports = router;