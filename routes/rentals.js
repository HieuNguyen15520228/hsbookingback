const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');
const upload = require('../services/image-upload');
const singleUpload = upload.single('image');
const manyUpload = upload.any();
const UserCtrl = require('../controllers/user');
const RentalCtrl = require('../controllers/rental')
const Datauri = require('datauri');
const path = require('path');
const cloudinary = require('cloudinary')
const multerUpload = require('../services/multerUpload')

router.get('/secret', UserCtrl.authMiddleware, function (req, res) {
    res.json({ "secret": true });
});

router.get('/manage', UserCtrl.authMiddleware, RentalCtrl.getUserRentals);

router.get('/:id/verify-user', UserCtrl.authMiddleware, RentalCtrl.verifyUser);

router.get('/:id', UserCtrl.authOrNot ,RentalCtrl.addSearchHistory);

router.get('/search/top', RentalCtrl.getTopRentals);

router.patch('/:id', UserCtrl.authMiddleware, function (req, res) {
    const rentalData = req.body;
    const user = res.locals.user;

    Rental
        .findById(req.params.id)
        .populate('user')
        .exec(function (err, foundRental) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            if (foundRental.user.id !== user.id) {
                return res.status(422).send({ errors: [{ title: 'Invalid User!', detail: 'You are not rental owner!' }] });
            }

            foundRental.set(rentalData);
            foundRental.save(function (err) {
                if (err) {
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                }
                return res.status(200).send(foundRental);
            });
        });
});

router.delete('/:id', UserCtrl.authMiddleware, RentalCtrl.deleteRental );

router.post('/create', UserCtrl.authMiddleware, multerUpload.multerUploads2, RentalCtrl.createRental )
router.get('',  (req, res) => {
  const city = req.query.city;
  const query = city ? { city: city.toLowerCase() } : {};
  Rental.find(query)
  .where({status:'approved'})
  .sort({createdAt: -1})
    .select('-bookings')
    .exec((err, foundRentals) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (city && foundRentals.length === 0) {
                return res.status(422).send({ errors: { title: 'No Rentals Found!', detail: `There are no rentals for city ${city}` } });
            }
            return res.json(foundRentals);
        });
});
router.post('/update/:id', UserCtrl.authMiddleware, multerUpload.multerUploads2, RentalCtrl.updateRental )
module.exports = router;


