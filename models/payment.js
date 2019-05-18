const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  fromUser: { type: Schema.Types.ObjectId, ref: 'User'},
  toUser: { type: Schema.Types.ObjectId, ref: 'User'},
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  totalPrice: Number,
  payerID : {type: String},
  paymentID: {type: String},
  paymentToken: {type: String},
});

module.exports = mongoose.model('Payment', paymentSchema );
