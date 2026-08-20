const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

async function checkItemIds() {
  console.log('=== KIỂM TRA ITEM_ID CÁC SẢN PHẨM GIỮA CÁC QUỐC GIA (VN, PH, MY, ID) ===\n');

  // 1. Kiểm tra bảng products trong SQLite
  const productRows = await new Promise((res, rej) => {
    db.all("SELECT id, item_id, shop_id, country FROM products", (err, rows) => {
      if (err) return res([]);
      res(rows || []);
    });
  });

  console.log(`1. Trong bảng products: Có ${productRows.length} sản phẩm.`);

  // 2. Kiểm tra bảng video_tasks (nơi lưu các sản phẩm gắn vào từng video)
  const taskRows = await new Promise((res, rej) => {
    db.all(`
      SELECT vt.id, vt.products, t.country as thread_country, u.country as user_country
      FROM video_tasks vt
      LEFT JOIN users u ON vt.user_id = u.id
      LEFT JOIN threads t ON t.user_id = u.id
      WHERE vt.products IS NOT NULL AND vt.products != '' AND vt.products != '[]'
    `, (err, rows) => {
      if (err) return res([]);
      res(rows || []);
    });
  });

  console.log(`2. Trong bảng video_tasks: Có ${taskRows.length} tasks có gắn sản phẩm.`);

  // Thu thập tất cả item_id theo từng quốc gia
  // Map: itemId -> Set of countries
  const itemToCountries = new Map();
  const countryItemCount = { vn: new Set(), ph: new Set(), my: new Set(), id: new Set(), other: new Set() };

  // Nạp từ bảng products
  productRows.forEach(p => {
    if (!p.item_id) return;
    const c = (p.country || 'vn').toLowerCase();
    const itemIdStr = String(p.item_id);
    if (!itemToCountries.has(itemIdStr)) itemToCountries.set(itemIdStr, new Set());
    itemToCountries.get(itemIdStr).add(c);
    if (countryItemCount[c]) countryItemCount[c].add(itemIdStr);
    else countryItemCount.other.add(itemIdStr);
  });

  // Nạp từ bảng video_tasks
  taskRows.forEach(t => {
    const c = (t.thread_country || t.user_country || 'vn').toLowerCase();
    let prods = [];
    try {
      prods = typeof t.products === 'string' ? JSON.parse(t.products) : (t.products || []);
    } catch(e) { prods = []; }

    prods.forEach(p => {
      const itemId = p.item_id || p.itemId || p.id;
      if (itemId) {
        const itemIdStr = String(itemId);
        if (!itemToCountries.has(itemIdStr)) itemToCountries.set(itemIdStr, new Set());
        itemToCountries.get(itemIdStr).add(c);
        if (countryItemCount[c]) countryItemCount[c].add(itemIdStr);
        else countryItemCount.other.add(itemIdStr);
      }
    });
  });

  console.log('\n📊 THỐNG KÊ SỐ LƯỢNG ITEM_ID DUY NHẤT THEO TỪNG QUỐC GIA:');
  console.log(`   - 🇻🇳 Việt Nam (VN)  : ${countryItemCount.vn.size.toLocaleString()} sản phẩm duy nhất`);
  console.log(`   - 🇵🇭 Philippines (PH): ${countryItemCount.ph.size.toLocaleString()} sản phẩm duy nhất`);
  console.log(`   - 🇲🇾 Malaysia (MY)   : ${countryItemCount.my.size.toLocaleString()} sản phẩm duy nhất`);
  console.log(`   - 🇮🇩 Indonesia (ID)  : ${countryItemCount.id.size.toLocaleString()} sản phẩm duy nhất`);

  // 3. Tìm các item_id xuất hiện ở từ 2 quốc gia trở lên
  const duplicates = [];
  for (const [itemId, countriesSet] of itemToCountries.entries()) {
    if (countriesSet.size > 1) {
      duplicates.push({
        itemId,
        countries: Array.from(countriesSet)
      });
    }
  }

  console.log('\n🔍 KẾT QUẢ KIỂM TRA TRÙNG LẶP CHÉO GIỮA CÁC QUỐC GIA:');
  console.log(`👉 Tổng số item_id bị trùng giữa các quốc gia: ${duplicates.length} sản phẩm.`);

  if (duplicates.length > 0) {
    console.log('\nDanh sách các item_id bị trùng chéo giữa các nước (10 mẫu đầu tiên):');
    duplicates.slice(0, 10).forEach(d => {
      console.log(`   - Item ID: ${d.itemId} -> Xuất hiện ở các nước: [${d.countries.join(', ').toUpperCase()}]`);
    });
  } else {
    console.log('✅ KHÔNG CÓ BẤT KỲ ITEM_ID NÀO BỊ TRÙNG NHAU GIỮA CÁC QUỐC GIA!');
  }

  // 4. Giải thích bản chất item_id trên Shopee Global
  console.log('\n======================================================');
  console.log('💡 BẢN CHẤT ITEM_ID TRÊN SHOPEE QUỐC TẾ:');
  console.log('Shopee sử dụng hệ thống BigInt (ID 10-11 chữ số ngẫu nhiên tăng dần theo từng khu vực thị trường).');
  console.log('Mỗi sản phẩm trên từng sàn (Shopee VN, Shopee PH, Shopee MY, Shopee ID) đều có 1 item_id ĐỘC BẢN DUY NHẤT.');
  console.log('Kể cả cùng 1 người bán xuyên biên giới (Cross-border / SIP), Shopee vẫn nhân bản sản phẩm sang sàn nước khác với 1 item_id HOÀN TOÀN MỚI.');

  db.close();
}

checkItemIds().catch(e => { console.error(e); db.close(); });
