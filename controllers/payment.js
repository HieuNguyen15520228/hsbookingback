const Payment = require('../models/payment');
const Booking = require('../models/booking');

const Rental = require('../models/rental');
const User = require('../models/user');

const { normalizeErrors } = require('../helpers/mongoose');

const config = require('../config');
const stripe = require('stripe')(config.STRIPE_SK);

exports.getPendingPayments = function (req, res) {

    const user = res.locals.user;

    Payment
        .where({ toUser: user })
        .populate({
            path: 'booking',
            populate: { path: 'rental' }
        })
        .populate('fromUser')
        .exec(function (err, foundPayments) {
            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            return res.json(foundPayments);
        })
}
exports.createPayment = (req, res) => {
    console.log(req.body);
    const user = res.locals.user;
    const { toUser, booking, totalPrice, payerID, paymentID, paymentToken } = req.body;
    const fromUser = user._id;
    Booking.findByIdAndUpdate({ _id: booking }, { status: 'paid' }, (err, foundBooking) => {
        if (err)
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if (!foundBooking)
            return res.status(403).send({ errors: [{ title: 'Không tìm thấy', detail: 'Đặt phòng không tồn tại!' }] });
        if (foundBooking) {
            const payment = new Payment({ fromUser, toUser, booking, totalPrice, payerID, paymentID, paymentToken })
            Payment.create(payment, (err, newPayment) => {
                if (err)
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                if (newPayment)
                {
                  foundBooking.payment = newPayment._id;
                  foundBooking.status = "Paid";
                  foundBooking.save(err => {
                    if(err)
                      return res.status(422).send({ errors: normalizeErrors(err.errors) });                      
                    return res.status(200).json(foundBooking);
                  })
                }
                    // Booking.find({ user: fromUser }, (err, foundBooking) => {
                    //     if (err)
                    //         return res.status(422).send({ errors: normalizeErrors(err.errors) });
                    //     if(foundBooking)
                    //         return res.json(foundBooking);
                    // })
            })
        }
    })

}

exports.confirmPayment = function (req, res) {
    const payment = req.body;
    const user = res.locals.user;

    debugger;

    Payment.findById(payment._id)
        .populate('toUser')
        .populate('booking')
        .exec(async function (err, foundPayment) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            if (foundPayment.status === 'pending' && user.id === foundPayment.toUser.id) {

                const booking = foundPayment.booking;

                const charge = await stripe.charges.create({
                    amount: booking.totalPrice * 100,
                    currency: 'usd',
                    customer: payment.fromStripeCustomerId
                })

                if (charge) {
                    Booking.update({ _id: booking }, { status: 'active' }, function () { });

                    foundPayment.charge = charge;
                    foundPayment.status = 'paid';

                    foundPayment.save(function (err) {
                        if (err) {
                            return res.status(422).send({ errors: normalizeErrors(err.errors) });
                        }


                        User.update({ _id: foundPayment.toUser }, { $inc: { revenue: foundPayment.amount } }, function (err, user) {
                            if (err) {
                                return res.status(422).send({ errors: normalizeErrors(err.errors) });
                            }

                            return res.json({ status: 'paid' });
                        })
                    })
                }
            }
        });
}



exports.declinePayment = function (req, res) {
    const payment = req.body;
    const { booking } = payment;

    Booking.deleteOne({ id: booking._id }, (err, deletedBooking) => {

        if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }

        Payment.update({ _id: payment._id }, { status: 'declined' }, function () { });
        Rental.update({ _id: booking.rental }, { $pull: { bookings: booking._id } }, () => { });

        return res.json({ status: 'deleted' });

    })
}

























