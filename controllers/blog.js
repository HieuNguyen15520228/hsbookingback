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
  console.log(content)
  const blog = new Blog({ title, content, image, author});
  blog.save((err) => {
    if(err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }})
  return res.status(200).json({detail:"Xin hãy đợi kiểm duyệt"})
}

exports.getBlog = (req,res) => {
  Blog.find({})
  .sort({createdAt: -1})
  .populate('author','image username _id')
  .exec((err, blogs) => {
    if(err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    return res.status(200).json(blogs)
  })
}
exports.getBlogById = (req, res) => {
  const blogId = req.body.blogId;
  Blog.findByIdAndUpdate(blogId,{ $inc: { viewCount: 1 }})
  .populate('author','image username _id')
  .exec((err,blog) => {
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(blog){
      return res.status(200).json(blog)
    }
    if(!blog)
      return res.status(404).json({detail: "Không tìm thấy bài blog"})
  })
}

exports.getPedingBlogs = (req,res) => {
  console.log('1')
  Blog.find({status:'pending'})
  .populate('author','image _id user')
  .exec((err,blog) => {
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(blog)
      return res.status(200).json(blog)
    if(!blog)
      return res.status(404).json({detail: "Không tìm thấy bài blog"})
  })
}
