const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT DISTINCT u.username
  FROM users u
  LEFT JOIN threads t ON u.id = t.user_id
  WHERE u.country = 'my' OR t.country = 'my' OR u.username LIKE 'MY%'
  ORDER BY u.username ASC
`, (err, rows) => {
  if (err) return console.error(err);
  console.log('=== DANH SÁCH TÀI KHOẢN MY ===');
  rows.forEach(r => console.log(r.username));
  db.close();
});
