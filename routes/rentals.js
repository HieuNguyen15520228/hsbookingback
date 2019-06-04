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

router.get('/search/top', (req, res) => {
    Rental
        .find({})
        .sort({ rating: -1 })
        .limit(10)
        .select('_id image title address rating price')
        .exec(function (err, foundRental) {
            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }
            return res.json(foundRental);
        });
});

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
router.get('', function (req, res) {
    const city = req.query.city;
    const query = city ? { city: city.toLowerCase() } : {};
    Rental.find(query)
        .select('-bookings')
        .exec(function (err, foundRentals) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }
            if (city && foundRentals.length === 0) {
                return res.status(422).send({ errors: { title: 'No Rentals Found!', detail: `There are no rentals for city ${city}` } });
            }
            return res.json(foundRentals);
        });
});
router.post('/update/:id', UserCtrl.authMiddleware, multerUpload.multerUploads2, function (req, res) {
    const user = res.locals.user
    Rental.findById(req.params.id, (err, foundRental) => {
        if (err)
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if (!foundRental)
            return res.status(422).send({ errors: [{ title: 'No Rentals Found!', detail: `Không tồn tại nơi ở này` }] });
        if (String(foundRental.user) !== String(user._id)) {
            return res.status(422).send({ errors: [{ title: 'Không có quyền!', detail: `Bạn không có quyền chỉnh sửa` }] });
        } 
        const { title, city, address, category, bedrooms, bathrooms, description, price, people, isTv, isWifi,
            isElevator, isWashing, isFridge, isConditioner, image } = req.body;
        const change = image.map(i => {
            if (i.includes(',')) {
                // const base64 = (i.split(','))[1]
                return cloudinary.uploader.upload(i)
                    .then(result =>
                        image[image.indexOf(i)] = result.url.slice(0, 45) + "q_auto:low/" + result.url.slice(45)
                    )

            }
        })
        Promise.all(change).then(() => {
            Object.assign(req.body, image);
            const data = {title, city, address, category, bedrooms, bathrooms, 
                description, price, people, isTv, isWifi,
                isElevator, isWashing, isFridge, isConditioner, image}
            Rental.findByIdAndUpdate({ _id: req.body._id }, data, { new: true }, (err, rental) => {
                res.json(rental)
            })
        })
    })
})
module.exports = router;


