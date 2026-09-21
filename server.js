const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS numbers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        provider TEXT NOT NULL,
        reports INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ جدول الأرقام جاهز');
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
}
initDB();

app.get('/api/search/phone/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.trim();
    const result = await pool.query(
      'SELECT name, phone, provider, reports FROM numbers WHERE phone LIKE $1',
      [`%${phone}%`]
    );
    if (result.rows.length === 0) return res.json({ found: false });
    res.json({ found: true, results: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/search/name/:name', async (req, res) => {
  try {
    const name = req.params.name.trim();
    const result = await pool.query(
      'SELECT name, phone, provider, reports FROM numbers WHERE name LIKE $1',
      [`%${name}%`]
    );
    if (result.rows.length === 0) return res.json({ found: false });
    res.json({ found: true, results: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/report', async (req, res) => {
  try {
    const { phone } = req.body;
    await pool.query('UPDATE numbers SET reports = reports + 1 WHERE phone = $1', [phone]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/add', async (req, res) => {
  const { name, phone, provider, adminKey } = req.body;
  if (adminKey !== 'mahmoud2026') return res.status(403).json({ error: 'غير مصرح' });
  try {
    await pool.query(
      'INSERT INTO numbers (name, phone, provider) VALUES ($1, $2, $3)',
      [name, phone, provider]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/delete/:id', async (req, res) => {
  const { adminKey } = req.query;
  if (adminKey !== 'mahmoud2026') return res.status(403).json({ error: 'غير مصرح' });
  try {
    await pool.query('DELETE FROM numbers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/all', async (req, res) => {
  const { adminKey } = req.query;
  if (adminKey !== 'mahmoud2026') return res.status(403).json({ error: 'غير مصرح' });
  try {
    const result = await pool.query('SELECT * FROM numbers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', app: 'محمود برو', developer: 'محمود جباري' });
});

app.listen(PORT, () => console.log(`✅ يعمل على المنفذ ${PORT}`));
