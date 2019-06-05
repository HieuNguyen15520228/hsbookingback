const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config/prod');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
//16/03
const upload = require('../services/image-upload');
const singleUpload = upload.single('image');
//26/03
const cloudinary = require('cloudinary')
const multerUpload = require('../services/multerUpload')


exports.getUser = (req, res) => {
  const requestedUserId = req.params.id;
  const user = res.locals.user;
  if (requestedUserId === user.id) {
    User.findById(requestedUserId)
      .select('-revenue -createdAt -password -resetPasswordToken -resetPasswordExpires')
      .populate("searchHistory",'image title address _id')
      .exec((err, foundUser) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundUser);
      })
  }
  // else
  //   return res.status(422).send({ errors: normalizeErrors(err.errors) });
}
exports.getAllUser = (req, res) => {
    User.find()
      .populate("searchHistory",'image title address _id')
      .populate('rentals bookings')
      .exec((err, foundUser) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundUser);
      })
  
}




exports.auth = (req, res) => {
  const { email, password } = req.body;

  if (!password || !email) {
    return res.status(422).send({ title: 'Data missing!', detail: 'Provide email and password!' });
  }

  User.findOne({ email }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(404).send({ errors: { title: 'Người dùng không hợp lệ!', detail: 'Người dùng không tồn tại' } });
    }
  
    if (user.hasSamePassword(password)) {
      const token = jwt.sign({
        userId: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role
      }, config.SECRET, { expiresIn: '12h' });

      return res.json(token);
    } else {
      return res.status(400).send({ errors: { title: 'Sai dữ liệu!', detail: 'Mật khẩu hoặc email không chính xác' }});
    }
  });
}





exports.isAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (token) {
    const user = parseToken(token);

    User.findById(user.userId, (err, user) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (user && user.role==='admin'){
        res.locals.user = user;
        next();
      } else {
        return res.status(401).send({ errors: { title: 'Không được chứng thực!', detail: 'Ban khong phai ADMIN!' } });

      }
    })
  } else {
    return notAuthorized(res);
  }
}

function parseToken(token) {
  return jwt.verify(token.split(' ')[1], config.SECRET);
}

function notAuthorized(res) {
  return res.status(401).send({ errors: { title: 'Không được chứng thực!', detail: 'Bạn cần phải đăng nhập!' } });
}

exports.updateInfo = (req, res) => {
  const data = req.body
  const user = res.locals.user;
  const _id = user.id
  User.findOne({ _id }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(422).send({ errors: [{ title: 'Người dùng không hợp lệ!', detail: 'Người dùng không tồn tại' }] });
    }
    User.findOneAndUpdate({ _id }, data, (err, user) => {
      if (err)
        return res.status(422).send({ errors: normalizeErrors(err.errors) });

      if (user)
        return res.json(user)
    })           // returns Query

  })
}
