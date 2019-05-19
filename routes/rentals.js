const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');
const upload = require('../services/image-upload');
const singleUpload = upload.single('image');
const manyUpload = upload.any();
const UserCtrl = require('../controllers/user');
const Datauri = require('datauri');
const path = require('path');
const cloudinary = require('cloudinary')
const multerUpload = require('../services/multerUpload')

router.get('/secret', UserCtrl.authMiddleware, function (req, res) {
    res.json({ "secret": true });
});

router.get('/manage', UserCtrl.authMiddleware, function (req, res) {
    const user = res.locals.user;

    Rental
        .where({ user })
        .populate('bookings')
        .exec(function (err, foundRentals) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            return res.json(foundRentals);
        });
});

router.get('/:id/verify-user', UserCtrl.authMiddleware, function (req, res) {
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


            return res.json({ status: 'verified' });
        });
});

router.get('/:id', UserCtrl.authOrNot ,(req, res) => {
    const rentalId = req.params.id;
    const user= res.locals.user;
    Rental.findById(rentalId)
        .populate('user', 'username _id image message')
        .populate('bookings', 'startAt endAt -_id')
        .exec(function (err, foundRental) {

            if (err || !foundRental) {
                return res.status(422).send({ errors: [{ title: 'Rental Error!', detail: 'Could not find Rental!' }] });
            }
            if(user){
              console.log(rentalId)
              const searchHistory = user.searchHistory;
              for (let i = 0; i < searchHistory.length; i++) {
                if (searchHistory[i] === rentalId) {
                  searchHistory.splice(i, 1);
                }
              }
              if(rentalId)
                searchHistory.unshift(rentalId)
              user.save((err) => {
                if (err) {
                  return res.status(422).send({ errors: normalizeErrors(err.errors) });
              }})
            }
            return res.json(foundRental);
        });
});

router.get('/find/search', (req, res) => {
    console.log(req.query);
})


router.get('/search/top', function (req, res) {
    Rental
        .find({})

        .sort({ rating: -1 })
        .limit(5)
        .select('-image -description')
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

router.delete('/:id', UserCtrl.authMiddleware, function (req, res) {
    const user = res.locals.user;
    Rental
        .findById(req.params.id)
        .populate('user', '_id')
        .populate({
            path: 'bookings',
            select: 'startAt',
            match: { startAt: { $gt: new Date() } }
        })
        .exec(function (err, foundRental) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            if (user.id !== foundRental.user.id) {
                return res.status(422).send({ errors: [{ title: 'Invalid User!', detail: 'You are not rental owner!' }] });
            }

            if (foundRental.bookings.length > 0) {
                return res.status(422).send({ errors: [{ title: 'Active Bookings!', detail: 'Cannot delete rental with active bookings!' }] });
            }

            foundRental.remove(function (err) {
                if (err) {
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                }
                Rental.find({}).then((rental) => res.json(rental))
                // return res.json({ 'status': 'deleted' });
            });
        });
});

router.post('/create', UserCtrl.authMiddleware, multerUpload.multerUploads2, function (req, res) {
    // const dUri = new Datauri();
    Rental.findOne({ title: req.body.title }, (err, foundRental) => {
        if (err)
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if (foundRental)
            return res.status(422).send({ errors: [{ title: 'Rentals Found!', detail: `Tên đã có người sử dụng` }] });
        const { title, city, address, category, bedrooms, bathrooms, description, price, people, isTv, isWifi,
            isElevator, isWashing, isFridge, isConditioner, image } = req.body;
        const change = image.map(i => {
            if (i.includes(',')) {
                return cloudinary.uploader.upload(i)
                    .then(result =>
                        image[image.indexOf(i)] = result.url.slice(0, 45) + "q_auto:low/" + result.url.slice(45)
                    )

            }
        })
        Promise.all(change)
            .then(() => {
                const rental = new Rental({
                    title, city, address, category, bedrooms, bathrooms,
                    description, price, people, isTv, isWifi, isElevator, isWashing, isFridge,
                    isConditioner, image
                });
                const user = res.locals.user;
                rental.user = user;
                Rental.create(rental, function (err, newRental) {
                    if (err) {
                        console.log(err)
                        return res.status(422).send({ errors: normalizeErrors(err.errors) });
                    }
                    User.update({ _id: user.id }, { $push: { rentals: newRental } }, function () { });
                    return res.json(newRental);
                });
            })
            .catch((err) => { return res.status(422).send({ errors: normalizeErrors(err.errors) }); })
    });
})
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
                return res.status(422).send({ errors: [{ title: 'No Rentals Found!', detail: `There are no rentals for city ${city}` }] });
            }

            return res.json(foundRentals);
        });
});
router.post('/update/:id', UserCtrl.authMiddleware, multerUpload.multerUploads2, function (req, res) {
    const user = res.locals.user
    console.log(req.body.user)
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


