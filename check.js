const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:EG1%olding123@212.85.24.238:5432/cari_kerja?sslmode=disable' });
client.connect().then(() => client.query(\SELECT column_name FROM information_schema.columns WHERE table_name = 'users'\)).then(res => { console.log('Columns:', res.rows.map(r => r.column_name).join(', ')); return client.end(); });
