const sql = require('mssql');
const config = require('../db/dbConfig');

const getChapterByNovel = async (req, res) => {
  const { novelId, chapterId } = req.params;

  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM chapters 
      WHERE id = ${chapterId} AND novel_id = ${novelId}`;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

module.exports = { getChapterByNovel };
