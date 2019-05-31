const express = require('express');
const router = express.Router();

const UserCtrl = require('../controllers/user');
const CommentCtrl = require('../controllers/comment');

router.post("/post", UserCtrl.authMiddleware, CommentCtrl.postComment)

module.exports = router;


