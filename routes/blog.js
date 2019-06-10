const express = require('express');
const router = express.Router();

const BlogCtrl = require('../controllers/blog');
router.post('/post', BlogCtrl.createBlog );

module.exports = router;
