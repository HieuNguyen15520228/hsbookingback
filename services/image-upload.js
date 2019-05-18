const aws = require('aws-sdk');
const multer = require('multer');
// const multerS3 = require('multer-s3');
const config = require('../config');

// aws.config.update({
//   secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
//   accessKeyId: config.AWS_ACCESS_KEY_ID,
//   region: 'us-east-1'
// });

// const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Tệp không hợp lệ, chỉ PNG/JPEG'), false);
  }
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/rentals');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});


// const upload = multer({
//   fileFilter,
//   storage: multerS3({
//     acl: 'public-read',
//     s3,
//     bucket: 'bwm-ng-dev',
//     metadata: function (req, file, cb) {
//       cb(null, {fieldName: 'TESTING_METADATA'});
//     },
//     key: function (req, file, cb) {
//       cb(null, Date.now().toString())
//     }
//   })
// });

module.exports = upload;
