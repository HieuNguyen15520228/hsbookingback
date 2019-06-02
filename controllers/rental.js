const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment')

const { normalizeErrors } = require('../helpers/mongoose');

exports.getUserRentals = (req, res) => {
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
}

exports.verifyUser = (req, res) => {
  const user = res.locals.user;

    Rental
        .findById(req.params.id)
        .populate('user')
        .exec(function (err, foundRental) {
            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            if (foundRental.user.id !== user.id) {
                return res.status(422).send({ errors: { title: 'Invalid User!', detail: 'You are not rental owner!' } });
            }


            return res.json({ status: 'verified' });
        });
}

exports.addSearchHistory = (req, res) => {
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
              const searchHistory = user.searchHistory;
              for (var i = 0; i < searchHistory.length; i++) {
                if (String(searchHistory[i]._id) === rentalId) {
                  searchHistory.splice(i, 1);
                }
              }
              if(rentalId)
                searchHistory.unshift(rentalId)
              user.searchHistory = searchHistory;
              console.log(searchHistory);
              user.save((err) => {
                if (err) {
                  return res.status(422).send({ errors: normalizeErrors(err.errors) });
              }})
            }
            return res.json(foundRental);
        });
}