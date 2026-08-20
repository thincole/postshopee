const axios = require('axios');

async function checkPostgresProducts() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/products', { timeout: 3000 });
    console.log('Postgres products count:', res.data?.length);
  } catch(e) {
    console.log('Postgres server check:', e.message);
  }
}

checkPostgresProducts();
