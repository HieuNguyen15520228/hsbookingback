const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const config = require('./config');
const Rental = require('./models/rental');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');

dotenv.config();
const cloudinaryConfig = (req, res, next) => {
    cloudinary.config({
        cloud_name: 'hsuit',
        api_key: '126822664667284',
        api_secret: 'c4PmU_ayn3KRXaCOdTi9tr8d-04',
    });
    next();
}
var api = new ParseServer({
  databaseURI: 'mmongodb://nhat123:nhat123@ds147225.mlab.com:47225/rentaluit', // Connection string for your MongoDB database
  cloud: __dirname + '/config/cloud.js', // Absolute path to your Cloud Code
  appId: 'uithsbooking',
  masterKey: 'uit123456', // Keep this key secret!
  fileKey: 'uit123456',
  serverURL: 'https://hsbookingbackend.glitch.me/parse' // Don't forget to change to https if needed
});
var options = { allowInsecureHTTP: false };
var trustProxy = true;

var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": "https://hsbookingbackend.glitch.me/parse",
      "appId": "uithsbooking",
      "masterKey": "uit123456",
      "appName": "uithsbooking"
    }
  ],  "trustProxy": 1

});
// Serve the Parse API on the /parse URL prefix
const rentalRoutes = require('./routes/rentals'),
      userRoutes = require('./routes/users'),
      bookingRoutes = require('./routes/bookings'),
      paymentRoutes = require('./routes/payments'),
      imageUploadRoutes = require('./routes/image-upload');
      var connectWithRetry = function() {
        return mongoose.connect('mongodb://nhat123:nhat123@ds147225.mlab.com:47225/rentaluit', function(err) {
          if (err) {
            console.log('Kết nối tới database thất bại - Đang thử lại');
            setTimeout(connectWithRetry, 1000);
          }
        });
      };
      connectWithRetry();
      // mongoose.connect();
// mongoose.connect(config.DB_URI).then(() => {
//   if (process.env.NODE_ENV !== 'production') {
//     const fakeDb = new FakeDb();
//     fakeDb.seedDb();
//   }
// });

const app = express();

app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
app.get('/', (req, res) => res.send('Hello World!') ); 
app.use('/dashboard', dashboard);
app.use('/parse', api);
app.use('*', cloudinaryConfig);
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', imageUploadRoutes);


if (process.env.NODE_ENV === 'production') {
  const appPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(appPath));

  app.get('*', function(req, res) {
    res.sendFile(path.resolve(appPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

app.listen(PORT , function() {
  console.log('Hello UIT!');
});
