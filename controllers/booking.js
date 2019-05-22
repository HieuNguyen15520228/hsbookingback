const Booking = require('../models/booking');
const Rental = require('../models/rental');
const Payment = require('../models/payment');
const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');
const moment = require('moment');

const config = require('../config');
// const stripe = require('stripe')(config.STRIPE_SK);

// const CUSTOMER_SHARE = 0.8;

exports.createBooking = (req, res) => {
  var error = false;
  const { startAt, endAt, guests, id, price/*rental, paymentToken*/ } = req.body;
  const user = res.locals.user;
  var d1 = new Date(startAt); //"now"
  var d2 = new Date(endAt)  // some date
  var timeDiff = Math.abs(d2.getTime() - d1.getTime());
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const totalPrice = price * days;
  // const totalPrice = rental.price * days;
  const booking = new Booking({ startAt, endAt, totalPrice, guests, days });
  Rental.findById(id)
    .populate('bookings')
    .populate('user')
    .exec(async function (err, foundRental) {
      console.log(foundRental.user)
      const user = res.locals.user;
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (foundRental.user != null) {
        if (foundRental.user.id === user._id) {
          return res.status(422).send({ errors: [{ title: 'Người dùng không hợp lệ!', detail: 'Không thể đặt phòng cho địa điểm bạn tạo!' }] });
        }
      }
      // const wait =  User.findById(user._id)
      //   .populate('bookings')
      //   .exec(async function (err, foundUser){
      //     if (!isValidUserBook(booking,foundUser)) 
      //       error = true;
      //   });
      //   Promise.all


      if (isValidBooking(booking, foundRental)) {
        booking.user = user;
        booking.rental = foundRental;
        booking.owner = foundRental.user;
        foundRental.bookings.push(booking);
        // const { payment, err } = await createPayment(booking, foundRental.user, paymentToken);

        // if (payment) {

        // booking.payment = payment;
        booking.save(function (err) {
          if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
          }

          foundRental.save()
          User.update({ _id: user._id }, { $push: { bookings: booking } }, function () { });
          Booking
            .where({ user })
            .populate('owner', 'image username _id')
            .populate('rental')
            .exec(function (err, foundBookings) {
              if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
              }
              return res.json(foundBookings);
            });

        });
        // } else {

        //   return res.status(422).send({ errors: [{ title: 'Payment Error', detail: err }] });
        // }
      } else {
        return res.status(422).send({ errors: [{ title: 'Đặt phòng không hợp lệ!', detail: 'Ngày bạn chọn đã được đặt!' }] });
      }
    })
}
exports.deleteBooking = function (req, res) {
  const user = res.locals.user;
  Booking
    .findById(req.params.id)
    .populate('user', '_id')
    .exec(function (err, foundBooking) {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (user.id !== foundBooking.user.id) {
        return res.status(422).send({ errors: [{ title: 'Invalid User!', detail: 'You are not booking owner!' }] });
      }

      foundBooking.remove(function (err) {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        Booking
          .where({ user })
          .populate('owner')
          .populate('rental')
          .exec(function (err, foundBookings) {
            if (err) {
              return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }
            return res.json(foundBookings);
          });
      });
    });

}
exports.getUserBookings = function (req, res) {
  const user = res.locals.user;
  Booking
    .where({ user })
    .populate('owner', 'image username _id')
    .populate('rental')
    .exec(function (err, foundBookings) {

      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      return res.json(foundBookings);
    });
}
exports.getBookingsById = (req, res) => {
  const user = res.locals.user;
  const bookingId = req.params.id;

  Booking
    .findById(bookingId )
    .populate('owner', 'image username _id')
    .populate('rental')
    .exec(function (err, foundBookings) {
      if (err) {
        console.log(err)
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (!foundBookings)
        return res.status(422).send({ errors: { title: 'Invalid Booking!', detail: 'Hóa đơn không tồn tại!' }});
      if (foundBookings) {
        console.log(foundBookings);
        return res.json(foundBookings);
      }
    });
}
// exports.getOldBookings = (req, res) => {
//   const user = res.locals.user;
//   Booking
//     .where({ user })
//     .where(+moment(endAt) < +moment())
//     .populate('rental')
//     .exec(function (err, foundBookings) {
//       if (err) {
//         return res.status(422).send({ errors: normalizeErrors(err.errors) });
//       }
//       return res.json(foundBookings);
//     });
// }
function isValidBooking(proposedBooking, rental) {
  let isValid = true;

  if (rental.bookings && rental.bookings.length > 0) {
    console.log(proposedBooking.startAt, " ", proposedBooking.endAt);

    isValid = rental.bookings.every(function (booking) {
      console.log(rental.bookings.startAt, " ", rental.bookings.endAt)
      const proposedStart = moment(proposedBooking.startAt);
      const proposedEnd = moment(proposedBooking.endAt);

      const actualStart = moment(booking.startAt);
      const actualEnd = moment(booking.endAt);

      return ((actualStart < proposedStart && actualEnd < proposedStart) || (proposedEnd < actualEnd && proposedEnd < actualStart));
    });
  }

  return isValid;
}
function isValidUserBook(proposedBooking, user) {
  let isValid = true;
  if (user.bookings && user.bookings.length > 0) {

    isValid = user.bookings.every(function (booking) {
      const proposedStart = moment(proposedBooking.startAt);
      const proposedEnd = moment(proposedBooking.endAt);

      const actualStart = moment(booking.startAt);
      const actualEnd = moment(booking.endAt);

      return ((actualStart < proposedStart && actualEnd < proposedStart) || (proposedEnd < actualEnd && proposedEnd < actualStart));
    });
  }
  console.log("isValid " + isValid);
  return isValid;
}
//Chưa làm dc
async function createPayment(booking, toUser, token) {
  const { user } = booking;
  const tokenId = token.id || token;

  const customer = await stripe.customers.create({
    source: tokenId,
    email: user.email
  });

  if (customer) {
    User.update({ _id: user.id }, { $set: { stripeCustomerId: customer.id } }, () => { });

    const payment = new Payment({
      fromUser: user,
      toUser,
      fromStripeCustomerId: customer.id,
      booking,
      tokenId: token.id,
      amount: booking.totalPrice * 100 * CUSTOMER_SHARE
    });

    try {
      const savedPayment = await payment.save();
      return { payment: savedPayment };

    } catch (err) {
      return { err: err.message };
    }

  } else {
    return { err: 'Cannot process Payment!' }
  }
}





