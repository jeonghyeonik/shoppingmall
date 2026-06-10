-- 회원 테이블
CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     username TEXT UNIQUE NOT NULL,
                                     password TEXT NOT NULL,
                                     name TEXT NOT NULL
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS posts (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     title TEXT NOT NULL,
                                     content TEXT NOT NULL,
                                     parent_id INTEGER,
                                     author TEXT,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 첨부파일 테이블
CREATE TABLE IF NOT EXISTS files (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     post_id INTEGER NOT NULL,
                                     filename TEXT NOT NULL,
                                     filepath TEXT NOT NULL,
                                     FOREIGN KEY(post_id) REFERENCES posts(id)
    );

-- 상품 테이블
CREATE TABLE IF NOT EXISTS products (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        name TEXT NOT NULL,
                                        description TEXT,
                                        price INTEGER NOT NULL,
                                        emoji TEXT,
                                        image TEXT,
                                        likes INTEGER DEFAULT 0,
                                        is_featured INTEGER DEFAULT 0
);

-- 장바구니 테이블
CREATE TABLE IF NOT EXISTS cart_items (
                                          user_id INTEGER NOT NULL,
                                          product_id INTEGER NOT NULL,
                                          quantity INTEGER DEFAULT 1,
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          PRIMARY KEY(user_id, product_id)
    );

-- 마이페이지 테이블
CREATE TABLE IF NOT EXISTS orders (
                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                      user_id TEXT NOT NULL,
                                      product_name TEXT NOT NULL,
                                      price INTEGER NOT NULL,
                                      quantity INTEGER NOT NULL,
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);