const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const fs = require('fs');

async function checkEnoentError() {
  console.log('=== KIỂM TRA LỖI ENOENT FILE NOT FOUND ===\n');

  const enoentThreads = await new Promise((res) => {
    db.all("SELECT id, user_id, error FROM threads WHERE error LIKE '%ENOENT%' LIMIT 5", (e, r) => res(r || []));
  });

  for (const t of enoentThreads) {
    console.log(`Luồng #${t.id} - Lỗi: ${t.error}`);
  }

  // Lấy các task bị lỗi ENOENT gần nhất
  const enoentTasks = await new Promise((res) => {
    db.all("SELECT id, username, video_path, video_filename, error, created_at FROM video_tasks WHERE error LIKE '%ENOENT%' ORDER BY id DESC LIMIT 5", (e, r) => res(r || []));
  });

  console.log('\nCác Tasks bị lỗi ENOENT:');
  for (const task of enoentTasks) {
    const exists = fs.existsSync(task.video_path);
    console.log(`- Task #${task.id} (${task.username}) | File: ${task.video_filename}`);
    console.log(`  Path: ${task.video_path}`);
    console.log(`  File còn trên đĩa không? -> ${exists ? 'CÒN' : '❌ ĐÃ BỊ XÓA MẤT'}`);

    // Kiểm tra xem file này đã được tài khoản nào đăng thành công trước đó chưa
    const prevCompleted = await new Promise((res) => {
      db.all("SELECT id, username, completed_at, post_id FROM video_tasks WHERE video_filename = ? AND status = 'completed'", [task.video_filename], (e, r) => res(r || []));
    });

    if (prevCompleted && prevCompleted.length > 0) {
      console.log(`  👉 Video này ĐÃ ĐƯỢC ĐĂNG THÀNH CÔNG trước đó bởi:`);
      prevCompleted.forEach(p => console.log(`     + User: ${p.username} lúc ${p.completed_at} (Post ID: ${p.post_id})`));
    }
  }

  db.close();
}

checkEnoentError().catch(e => { console.error(e); db.close(); });
