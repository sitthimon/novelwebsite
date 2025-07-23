const express = require('express');
const router = express.Router();
const { getChapterById, getChaptersByNovelId } = require('../controllers/chaptersController');

router.get('/:id', getChapterById); // /api/chapters/5
router.get('/novel/:novelId', getChaptersByNovelId); // /api/chapters/novel/1

module.exports = router;
