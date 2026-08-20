const db = require('../database/connection').getConnection();

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    cookie TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )
`;

db.run(createTableQuery, [], (err) => {
    if (err) {
        console.error('Lỗi khởi tạo bảng users:', err);
        return;
    }
    db.all('PRAGMA table_info(users)', [], (pragmaErr, rows) => {
        if (pragmaErr) return;
        const hasProxy = rows.some(r => r.name === 'proxy');
        const hasCountry = rows.some(r => r.name === 'country');
        const hasIsActive = rows.some(r => r.name === 'is_active');

        if (!hasProxy) {
            db.run("ALTER TABLE users ADD COLUMN proxy TEXT DEFAULT ''");
        }
        if (!hasCountry) {
            db.run("ALTER TABLE users ADD COLUMN country TEXT DEFAULT 'vn'");
        }
        if (!hasIsActive) {
            db.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
        }
        db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(LOWER(TRIM(username)));");
    });
});

class User {
    static getAll() {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT u.*, t.error AS thread_error, t.status AS thread_status 
         FROM users u 
         LEFT JOIN threads t ON u.id = t.user_id`,
                [],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    static create(username, cookie, proxy = '', country = 'vn') {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, cookie, proxy, country) VALUES (?, ?, ?, ?)',
                [username.trim(), cookie.trim(), proxy ? proxy.trim() : '', country ? country.trim().toLowerCase() : 'vn'],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    static async upsert(username, cookie, proxy = '', country = 'vn') {
        const cleanUser = (username || '').trim();
        if (!cleanUser) throw new Error('Tên người dùng không được để trống');
        const cleanCookie = (cookie || '').trim();
        const cleanProxy = (proxy || '').trim();
        const cleanCountry = (country || 'vn').trim().toLowerCase();

        const existing = await this.findByUsername(cleanUser);
        if (existing) {
            // Cập nhật giá trị mới cho tài khoản đã có sẵn (không tạo thêm dòng mới)
            const finalProxy = cleanProxy || existing.proxy || '';
            const finalCountry = cleanCountry || existing.country || 'vn';
            await new Promise((res, rej) => {
                db.run(
                    'UPDATE users SET cookie = ?, proxy = ?, country = ?, is_active = 1 WHERE id = ?',
                    [cleanCookie, finalProxy, finalCountry, existing.id],
                    err => err ? rej(err) : res()
                );
            });

            // Đồng bộ cập nhật sang bảng threads nếu đã có luồng
            if (finalProxy) {
                const parts = finalProxy.split(':');
                if (parts.length >= 2) {
                    const host = parts[0];
                    const port = parseInt(parts[1], 10);
                    const u = parts.length === 4 ? parts[2] : null;
                    const p = parts.length === 4 ? parts[3] : null;
                    db.run(
                        'UPDATE threads SET proxy_host = ?, proxy_port = ?, proxy_username = ?, proxy_password = ?, country = ?, error = NULL WHERE user_id = ?',
                        [host, port, u, p, finalCountry, existing.id]
                    );
                }
            }
            return { id: existing.id, isNew: false };
        } else {
            // Tạo mới người dùng nếu chưa từng tồn tại
            const newId = await this.create(cleanUser, cleanCookie, cleanProxy, cleanCountry);
            return { id: newId, isNew: true };
        }
    }

    static update(id, username, cookie) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET username = ?, cookie = ? WHERE id = ?',
                [username, cookie, id],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    static updateProxy(id, proxy) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET proxy = ? WHERE id = ?',
                [proxy || '', id],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    static updateCountry(id, country) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET country = ? WHERE id = ?',
                [country || 'vn', id],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('DELETE FROM video_tasks WHERE user_id = ?', [id], (err1) => {
                    if (err1) console.error('Error deleting video_tasks for user:', err1);
                });
                db.run('DELETE FROM threads WHERE user_id = ?', [id], (err2) => {
                    if (err2) console.error('Error deleting thread for user:', err2);
                });
                db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }

    static findByUsername(username) {
        if (!username) return Promise.resolve(null);
        const cleanUser = String(username).trim().toLowerCase();
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT u.*, t.error AS thread_error, t.status AS thread_status 
         FROM users u 
         LEFT JOIN threads t ON u.id = t.user_id 
         WHERE TRIM(LOWER(u.username)) = ?`,
                [cleanUser],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows && rows.length > 0 ? rows[0] : null);
                }
            );
        });
    }

    static updateUsername(id, username) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE users SET username = ? WHERE id = ?', [username, id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    static updateCookie(id, cookie) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE users SET cookie = ? WHERE id = ?', [cookie, id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    static updateIsActive(id, isActive) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

module.exports = User;