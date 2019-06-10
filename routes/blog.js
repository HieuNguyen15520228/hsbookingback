const express = require('express');
const router = express.Router();
const User = require('../controllers/user');

const BlogCtrl = require('../controllers/blog');

router.post('/post',User.authMiddleware, BlogCtrl.createBlog );
router.get('/get', BlogCtrl.getBlog)
module.exports = router;
