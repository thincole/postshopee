const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT DISTINCT u.username
  FROM users u
  LEFT JOIN threads t ON u.id = t.user_id
  WHERE u.country = 'ph' OR t.country = 'ph' OR u.username LIKE '%PH%'
  ORDER BY u.username ASC
`, (err, rows) => {
  if (err) return console.error(err);
  console.log('=== DANH SÁCH TÀI KHOẢN PH (PHILIPPINES) ===');
  rows.forEach(r => console.log(r.username));
  console.log(`\nTổng cộng: ${rows.length} tài khoản PH`);
  db.close();
});
