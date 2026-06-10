const orderRouter = require('./routes/order');
const cartRouter = require('./routes/cart');
const productsRouter = require('./routes/products');
const boardRouter = require('./routes/board');
const session = require('express-session');
const mypageRouter = require('./routes/mypage');
const adminRouter = require('./routes/admin');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const userRouter = require('./routes/user');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


const sqlite3 = require('sqlite3').verbose();
const wishDb = new sqlite3.Database(path.join(__dirname, 'db/database.sqlite'));
wishDb.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TEXT
    )
`, (err) => {
    if (err) console.error("❌ wishlist 테이블 생성 실패:", err.message);
    wishDb.close();
});

// routes
app.use('/mypage', mypageRouter);
app.use('/admin', adminRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/user', userRouter);
app.use('/board', boardRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/order', orderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

//
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server Running : ${PORT}`);
    });
}
module.exports = app;