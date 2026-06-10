var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

// 로그인 페이지 화면 보여주기
router.get('/login', function(req, res) {

    res.render('login');
});

// 실제 로그인 처리 로직
router.post('/login', function(req, res) {
    const { userid, password } = req.body;

    console.log("로그인 시도 아이디:", userid);

    res.redirect('/'); // 로그인 완료 후 메인페이지로 이동
});

module.exports = router;