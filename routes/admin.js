const express = require('express');
const router = express.Router();

const AdminCtrl = require('../controllers/admin-user');
const BookingCtrl = require('../controllers/admin-booking');

router.post('/login', AdminCtrl.auth );
router.get('/getUsers', AdminCtrl.getAllUser);
router.post('/deactive', AdminCtrl.isAdmkAdminCtrl.deactiveUser);
module.exports = router;
