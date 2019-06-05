const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment')
const cloudinary = require('cloudinary')

const { normalizeErrors } = require('../helpers/mongoose');

exports.getRentals = (req, res) => {
  const user = res.locals.user;

    Rental
        .find()
        .populate('bookings')
        .populate('user')
        .exec(function (err, foundRentals) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            return res.json(foundRentals);
        });
}



exports.createRental = (req, res) => {
    // const dUri = new Datauri();
    Rental.findOne({ title: req.body.title }, (err, foundRental) => {
        if (err)
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if (foundRental)
            return res.status(422).send({ errors: { title: 'Rentals Found!', detail: `Tên nhà ở đã có người sử dụng` } });
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
}
exports.deleteRental = (req, res) => {
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
                return res.status(422).send({ errors: { title: 'Invalid User!', detail: 'You are not rental owner!' }});
            }

            if (foundRental.bookings.length > 0) {
                return res.status(422).send({ errors: { title: 'Active Bookings!', detail: 'Không thể xóa nơi ở này' } });
            }

            foundRental.remove(function (err) {
                if (err) {
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                }
                Rental.find({}).then((rental) => res.json(rental))
                // return res.json({ 'status': 'deleted' });
            });
        });
}
exports.getTopRentals = (req, res) => {
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
}
exports.updateRental =(req, res) => {
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
}