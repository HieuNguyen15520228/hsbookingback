const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

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
  Comment.find({rental:rental, user:user},(err,cmt)=>{
    console.log(cmt)
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(cmt)
      return res.status(403).send({ errors: { title: 'Không được phép đánh giá!', detail: 'Bạn không thể đánh giá nữa' } });
    if(!cmt)
      {
        Comment.create(cmt, (err, cmt) => {
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(cmt)
    {
      Comment
        .aggregate([{$match: {rental:ObjectId(rental)}},
                    {
          $group: {_id: rental,avgRating: {$avg: "$rating"}}
        }
                   ])
        .exec((err,result) => 
              Rental.findByIdAndUpdate({_id:rental},{rating:result[0].avgRating},{new:true},(err,rental)=>{
        if(err) throw err;
        if(rental) console.log(rental)
      })
             );
      return res.status(200).json(cmt);
    }
  })
      }
  })
  
}
exports.getComment = (req,res) =>{
  const limit = req.body.limit;
  const page = req.body.page;
  const rentalId = req.body.rentalId;
  Comment.find({rental:rentalId})
  .sort('-createdAt')
  .populate('user','username image _id')
  .skip(limit*(page - 1))
  .limit(limit)
  .exec((err, comment)=>{
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(comment)
      return res.status(200).json(comment);
  })
}