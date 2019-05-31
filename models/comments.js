const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: 'User'},
  rental: { type: Schema.Types.ObjectId, ref: 'Rental'},
  rating: {type: Number, default: 1},
  comment: {type: String}
});

module.exports = mongoose.model('Comment', commentSchema );
