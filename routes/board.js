const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 게시글 목록 화면
router.get('/', (req, res) => {
    db.all(
        'SELECT * FROM posts WHERE parent_id IS NULL ORDER BY id DESC',
        [],
        (err, posts) => {
            db.all(
                'SELECT * FROM posts WHERE parent_id IS NOT NULL',
                [],
                (err2, replies) => {
                    res.render('board', {
                        posts: posts || [],
                        replies: replies || [],
                        user: req.session.user || null
                    });
                }
            );
        }
    );
});

// 글쓰기 페이지 이동
router.get('/new', (req, res) => {
    res.render('post', {
        post: null,
        user: req.session.user || null
    });
});

// 새 글 등록 처리
router.post('/new', (req, res) => {
    const { title, content } = req.body;
    // 로그인한 username을 작성자로 기록, 없으면 익명 처리
    const author = req.session.user ? req.session.user.name : '익명';

    db.run(
        'INSERT INTO posts(title, content, author) VALUES(?,?,?)',
        [title, content, author],
        (err) => {
            if (err) {
                return res.send('글 작성 실패');
            }
            res.redirect('/board');
        }
    );
});

// 게시글 상세보기
router.get('/view/:id', (req, res) => {
    db.get(
        'SELECT * FROM posts WHERE id=?',
        [req.params.id],
        (err, post) => {
            if (err || !post) {
                return res.send('존재하지 않는 게시글입니다.');
            }

            db.all(
                'SELECT * FROM posts WHERE parent_id=? ORDER BY id',
                [req.params.id],
                (err2, replies) => {
                    res.render('detail', {
                        post,
                        replies: replies || [],
                        user: req.session.user || null
                    });
                }
            );
        }
    );
});

// 수정 페이지 권한 검증
router.get('/edit/:id', (req, res) => {
    if (!req.session.user) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send('<script>alert("로그인이 필요합니다."); location.href="/user/login";</script>');
    }

    db.get('SELECT * FROM posts WHERE id=?', [req.params.id], (err, post) => {
        if (err || !post) {
            return res.send('게시글을 찾을 수 없습니다.');
        }

        if (post.author !== req.session.user.name && req.session.user.username !== 'admin') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send('<script>alert("본인이 작성한 글만 수정할 수 있습니다."); history.back();</script>');
        }

        res.render('edit', { post, user: req.session.user });
    });
});

// 수정 처리 반영
router.post('/edit/:id', (req, res) => {
    if (!req.session.user) return res.send('권한이 없습니다.');
    const { title, content } = req.body;

    db.run(
        'UPDATE posts SET title=?, content=? WHERE id=?',
        [title, content, req.params.id],
        (err) => {
            if (err) {
                return res.send('수정 실패');
            }
            res.redirect('/board/view/' + req.params.id);
        }
    );
});

// 삭제 자격 검증
router.get('/delete/:id', function(req, res) {
    if (!req.session.user) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send('<script>alert("로그인이 필요한 서비스입니다."); location.href="/user/login";</script>');
    }

    const postId = req.params.id;
    const loginUsername = req.session.user.username; // 계정 id
    const loginName = req.session.user.name;         // 유저 이름

    db.get('SELECT author FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err || !post) {
            return res.send('게시글을 찾을 수 없습니다.');
        }

        if (post.author === '익명') {
            if (loginUsername !== 'admin') {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.send('<script>alert("익명 게시글은 관리자(admin)만 삭제할 수 있습니다."); history.back();</script>');
            }
        }

        else {
            if (post.author !== loginName && loginUsername !== 'admin') {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.send('<script>alert("본인이 작성한 글만 삭제할 수 있습니다."); history.back();</script>');
            }
        }

        db.run('DELETE FROM posts WHERE id=?', [postId], (err) => {
            if (err) {
                return res.send('삭제 실패');
            }
            res.redirect('/board');
        });
    });
});

// 답글 작성 페이지 이동
router.get('/reply/:id', (req, res) => {
    db.get('SELECT * FROM posts WHERE id=?', [req.params.id], (err, post) => {
        if (err || !post) {
            return res.send('원본 글을 찾을 수 없습니다.');
        }
        res.render('reply', { post, user: req.session.user || null });
    });
});

// 답글 등록 처리
router.post('/reply/:id', (req, res) => {
    const { title, content } = req.body;
    const author = req.session.user ? req.session.user.name : '관리자';

    db.run(
        'INSERT INTO posts (title, content, author, parent_id) VALUES (?, ?, ?, ?)',
        [title, content, author, req.params.id],
        (err) => {
            if (err) {
                return res.send('답글 등록 실패');
            }
            res.redirect('/board');
        }
    );
});

module.exports = router;