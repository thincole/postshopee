const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

async function deleteAccounts() {
  console.log('=== TIẾN HÀNH XÓA TÀI KHOẢN ID3003 VÀ ID3044 ===\n');

  const usernames = ['ID3003', 'ID3044'];

  // 1. Tìm ID của 2 user
  const users = await new Promise((res, rej) => {
    db.all("SELECT id, username FROM users WHERE username IN (?, ?)", usernames, (err, rows) => {
      if (err) return rej(err);
      res(rows || []);
    });
  });

  console.log(`Tìm thấy ${users.length} người dùng:`, users);

  const userIds = users.map(u => u.id);

  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');

    // 2. Xóa video_tasks
    await new Promise((res) => {
      db.run(`DELETE FROM video_tasks WHERE user_id IN (${placeholders}) OR username IN (?, ?)`, [...userIds, ...usernames], function(err) {
        if (!err) console.log(`✅ Đã xóa ${this.changes} tasks trong video_tasks.`);
        res();
      });
    });

    // 3. Xóa threads
    await new Promise((res) => {
      db.run(`DELETE FROM threads WHERE user_id IN (${placeholders})`, userIds, function(err) {
        if (!err) console.log(`✅ Đã xóa ${this.changes} luồng trong threads.`);
        res();
      });
    });

    // 4. Xóa logs
    await new Promise((res) => {
      db.run(`DELETE FROM logs WHERE username IN (?, ?)`, usernames, function(err) {
        if (!err) console.log(`✅ Đã xóa ${this.changes} dòng logs.`);
        res();
      });
    });

    // 5. Xóa users
    await new Promise((res) => {
      db.run(`DELETE FROM users WHERE id IN (${placeholders})`, userIds, function(err) {
        if (!err) console.log(`✅ Đã xóa ${this.changes} tài khoản trong users.`);
        res();
      });
    });
  } else {
    console.log('⚠️ Không tìm thấy bản ghi nào của ID3003 và ID3044 trong bảng users (đã được xóa từ trước).');
    
    // Quét dọn tàn dư trong các bảng khác nếu còn
    db.run("DELETE FROM video_tasks WHERE username IN ('ID3003', 'ID3044')", function() {
      if (this.changes > 0) console.log(`🧹 Đã dọn dẹp ${this.changes} tasks tàn dư.`);
    });
    db.run("DELETE FROM logs WHERE username IN ('ID3003', 'ID3044')", function() {
      if (this.changes > 0) console.log(`🧹 Đã dọn dẹp ${this.changes} logs tàn dư.`);
    });
  }

  console.log('\n🎉 Hoàn tất quá trình xóa sạch ID3003 và ID3044!');
  db.close();
}

deleteAccounts().catch(e => { console.error(e); db.close(); });
