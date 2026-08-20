const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT username, country, is_active, cookie
  FROM users
  WHERE LOWER(country) = 'ph' AND is_active = 1
  ORDER BY username ASC
`, (err, rows) => {
  if (err) return console.error(err);
  console.log(`=== TÀI KHOẢN PH ĐANG KÍCH HOẠT (is_active = 1) TRONG QUẢN LÝ NGƯỜI DÙNG (${rows.length} tài khoản) ===`);
  rows.forEach(r => console.log(r.username));
  db.close();
});
