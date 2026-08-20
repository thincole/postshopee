const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT DISTINCT u.username, u.country, t.country as thread_country
  FROM users u
  LEFT JOIN threads t ON u.id = t.user_id
  WHERE u.country = 'ph' OR t.country = 'ph'
  ORDER BY u.username ASC
`, (err, rows) => {
  if (err) return console.error(err);
  console.log(`=== DANH SÁCH CHÍNH XÁC QUỐC GIA PH (${rows.length} tài khoản) ===`);
  rows.forEach(r => console.log(r.username));
  db.close();
});
