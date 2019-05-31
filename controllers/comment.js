const Payment = require('../models/payment');
const Booking = require('../models/booking');

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment')

const { normalizeErrors } = require('../helpers/mongoose');

exports.postComment = (req,res) => {
  const user = res.locals.user;
  
  
}