const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

async function cleanTimeoutErrors() {
  console.log('=== XÓA LỖI CŨ TIMEOUT VÀ RESET TASKS ===\n');

  // 1. Xóa thông báo lỗi Timeout trong bảng threads
  await new Promise((res) => {
    db.run("UPDATE threads SET error = NULL WHERE error LIKE '%Timeout%'", function(err) {
      console.log(`✅ Đã xóa thông báo lỗi Timeout cho ${this.changes} luồng.`);
      res();
    });
  });

  // 2. Reset các task bị Timeout sang pending
  await new Promise((res) => {
    db.run("UPDATE video_tasks SET status = 'pending', error = NULL WHERE error LIKE '%Timeout%'", function(err) {
      console.log(`✅ Đã reset ${this.changes} tasks bị dính Timeout sang pending để đăng.`);
      res();
    });
  });

  db.close();
}

cleanTimeoutErrors().catch(e => { console.error(e); db.close(); });
