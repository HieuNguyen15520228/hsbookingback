const express = require('express');
const router = express.Router();

const AdminCtrl = require('../controllers/admin-user');
const BookingCtrl = require('../controllers/admin-booking');
const RentalCrl = require('../controllers/admin-rental')
router.post('/login', AdminCtrl.auth );
router.get('/getUsers', AdminCtrl.isAdmin,AdminCtrl.getAllUser);
router.post('/deactive', AdminCtrl.isAdmin,AdminCtrl.deactiveUser);

router.get('/getRentals', AdminCtrl.isAdmin,RentalCrl.getRentals);
module.exports = router;
