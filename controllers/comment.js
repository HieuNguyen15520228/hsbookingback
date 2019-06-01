const Payment = require('../models/payment');
const Booking = require('../models/booking');

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment')

const { normalizeErrors } = require('../helpers/mongoose');

exports.postComment = (req,res) => {
  const user = res.locals.user._id;
  const rental = req.body.rentalId;
  const comment = req.body.comment;
  const rating = req.body.rating;
  const cmt =  new Comment ({user,rental,comment,rating});
  Comment.create(cmt, (err, cmt) => {
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(cmt)
      return res.status(200).json(cmt);
  })
}
exports.getComment = (req,res) =>{
  const limit = req.body.limit;
  const page = req.body.page;
  const rentalId = req.body.rentalId;
  Comment.find({rental:rentalId}, { comments: {$slice: [ limit*(page - 1), limit ] } })
  .exec((err, comment)=>{
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(comment)
      return res.status(200).json(comment);
  })
}