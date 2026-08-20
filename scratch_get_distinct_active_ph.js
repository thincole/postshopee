const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT DISTINCT username
  FROM users
  WHERE LOWER(country) = 'ph' AND is_active = 1 AND cookie IS NOT NULL AND TRIM(cookie) != ''
  ORDER BY username ASC
`, (err, rows) => {
  if (err) return console.error(err);
  console.log(`=== DANH SÁCH CHÍNH XÁC CÁC TÀI KHOẢN PH ĐANG KÍCH HOẠT (${rows.length} tài khoản) ===`);
  rows.forEach(r => console.log(r.username));
  db.close();
});
