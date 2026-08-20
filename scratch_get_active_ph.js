const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT u.username, t.status, t.videos_uploaded, t.count_video_upload, t.country
  FROM threads t
  JOIN users u ON t.user_id = u.id
  WHERE (t.country = 'ph' OR u.country = 'ph')
  ORDER BY u.username ASC
`, (err, rows) => {
  if (err) return console.error(err);
  console.log(`=== DANH SÁCH TÀI KHOẢN PH ĐANG DÙNG TRONG QUẢN LÝ LUỒNG (${rows.length} tài khoản) ===`);
  rows.forEach(r => console.log(r.username));
  db.close();
});
