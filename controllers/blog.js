const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Rental = require('../models/rental');
const User = require('../models/user');
const Blog = require('../models/blog')
const _ = require('lodash')
const { normalizeErrors } = require('../helpers/mongoose');

exports.createBlog = (req,res) => {
  const {title, content, image} = req.body;
  
}