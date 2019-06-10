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
  const author = res.locals.user._id;
  const {title, content, image} = req.body;
  const blog = new Blog({ title, content, image, author});
  blog.save((err) => {
    if(err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }})
  return res.status(200).json({detail:"Xin hãy đợi kiểm duyệt"})
}