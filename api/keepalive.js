const { Pool } = require('pg');

// Haelt die kostenfreie Supabase-Datenbank aktiv (pausiert sonst nach ca.
// 7 Tagen ohne Aktivitaet, siehe vercel.json "crons"). Reine Lese-Abfrage,
// keine Seiteneffekte.
let pgPool;
function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return pgPool;
}

module.exports = async (req, res) => {
  if (!process.env.POSTGRES_URL) {
    res.status(500).send('POSTGRES_URL fehlt als Vercel-Umgebungsvariable.');
    return;
  }

  try {
    await getPgPool().query('select 1');
    res.status(200).send('ok');
  } catch (err) {
    console.error('Keepalive-Query fehlgeschlagen:', err);
    res.status(500).send('Keepalive fehlgeschlagen.');
  }
};
