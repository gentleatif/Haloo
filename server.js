require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
//file import
const config = require("./config");
const Contactus = require("./src/models/contactus");
const Job = require("./src/models/job");
const Customer = require("./src/models/user_management/customer");
//creating express intances
const app = express();

app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use("/uploads", express.static("./uploads"));

// mogodb connection
mongoose.connect(config.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error"));
db.once("open", function () {
  console.log("Connection succeeded.");
});

const router = require("./src/routes")();
app.use(router);

const port = process.env.PORT || 3000;
// create http server and run socket io
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// run socket io
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
}); // listen to connection
io.on("connect", (socket) => {
  console.log("New client connected");
  // save socket id of user to mongodb
  socket.on("save-socket-id", (data) => {
    // receive customerId and socketId
    // save socketId to in Customer collection
    Customer.findOneAndUpdate(
      { _id: data.customerId },
      { $set: { socketId: data.socketId } },
      { new: true },
      (err, customer) => {
        if (err) {
          console.log(err);
        } else {
          console.log(customer);
        }
      }
    );
  });
  socket.on("message", (data) => {
    io.emit("message", "You are connected to server successfully");
  });
  // receive lat lon and jobId from customer using socket.io
  socket.on("sendLocation", async (data) => {
    console.log("data", data);
    // 1. lat
    // 2. lon
    // 3. jobId
    // find job by jobId
    const job = await Job.findOne({ _id: data.jobId });
    const vendor = await Customer.findOne({ _id: job.vendorId });
    const vendorSocketId = vendor.socketId;
    // send lat lon to vendor
    socket.broadcast.to(vendorSocketId).emit("sendLocation", data);
    // socket.broadcast.to(socketid).emit("message", "for your eyes only");
  });
});

global.io = io;
// require("dotenv").config();
// var express = require('express')
// var bodyParser = require('body-parser')
// var mongoose = require('mongoose')
// var path = require('path');
// const socket = require('socket.io');
// const jwt = require("jsonwebtoken");
// const Customer = require('./src/models/user_management/customer');
// const useragent = require('express-useragent');

// // importing models
// const Review = require('./src/models/review')
// const Job = require('./src/models/job')
// const Category = require('./src/models/service_info/category')

// // RAZORPAY
// const Razorpay = require('razorpay');
// let instance = new Razorpay({
//   key_id: 'rzp_test_IuHValP4if1Ug6',
//   key_secret: 'nGZPLrkvqYnNvAairjBwYaR3',
// });

// let razorpayInstance = () => {
//   return instance;
// }

// var cors = require('cors');
// const { route } = require("./src/routes/api/provider/profile_detail");

// var app = express()

// app.use(cors())

// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// )

// app.use(bodyParser.json())

// app.use(useragent.express());
// app.use('/uploads', express.static('./uploads'));

// mongoose.connect(
//   'mongodb+srv://Alex:Alex@cluster0-myor5.mongodb.net/Haloo?retryWrites=true&w=majority',
//   {useNewUrlParser: true, useUnifiedTopology: true}
// )

// var db = mongoose.connection

// db.on('error', console.error.bind(console, 'Connection error'))
// db.once('open', function (callback) {
//   console.log('Connection succeeded.')
// })

// // forwarding models to routes
// app.use((req, res, next) => {
//   console.log(`Request_Endpoint: ${req.method} ${req.url}`)
//   res.header("Access-Control-Allow-Origin", '*');
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

//   next()
// })

// let io;

// var getIOInstance = function(){
//   return io;
// };

// // Require Route
// // console.log('razorpayInstance Home', razorpayInstance);
// var router = require('./src/routes')(razorpayInstance, getIOInstance);
// // require('./src/routes')(app, io)
// app.use(router);

// app.use(express.static('client/build'));

// app.get('*', (req, res) => res.sendFile(path.resolve('client', 'build', 'index.html')));

// var port = process.env.PORT || 3000

// const server = app.listen(port, function () {
//   console.log('listining to port 3000')
// })

// io = socket(server);

// io.use(function(socket, next){
//   console.log(socket.handshake);
//   console.log(socket.handshake.query.token);
//   console.log("test");

//   try{
//     if (socket.handshake.query && socket.handshake.query.token){
//       const token = socket.handshake.query.token
//       console.log("token", token);
//       const decoded = jwt.verify(token, "config.TOKEN_KEY");
//       socket.user = decoded;
//       console.log("details",decoded);
//       next()
//     }else{
//       next(new Error('Authentication error'));
//     }
//   }catch(e){
//     console.log(e);
//     if (err) return next(new Error('Authentication error'));
//   }
// if (socket.handshake.query && socket.handshake.query.token){
//     jwt.verify(socket.handshake.query.token, "config.TOKEN_KEY", function(err, decoded) {
//       // console.log("test");
//       if (err) console.log(err);
//       if (err) return next(new Error('Authentication error'));
//       socket.decoded = decoded;
//       console.log(detail, socket.decoded)
//       next();
//     });
//   }
//   else {
//     next(new Error('Authentication error'));
//   }
// }).on("connection", async function (socket) {
//   console.log("Made socket connection");

//   data = await Customer.findOne({_id:socket.user})

//   console.log(data);

//   if(data){
//     data.socketId = socket.id;
//     await data.save();
//     io.to(socket.id).emit('connected', {
//       message: 'connected',
//     })

//     socket.on('disconnect', async function() {
//       console.log('Got disconnect!');
//       data = await Customer.findOne({_id:socket.user})
//       if(data){
//         data.socketId = socket.id;
//         await data.save();
//       }
//    });

//   }else{
//     console.log("error");
//     io.to(socket.id).emit('disconnected', {
//       error: 'Not able to get data from socket token',
//     });

//   }
// });

// io.on()

// io.use(function(socket, next){
//   if (socket.handshake.query && socket.handshake.query.token){
//     jwt.verify(socket.handshake.query.token, "config.TOKEN_KEY", function(err, decoded) {
//       console.log("test");
//       if (err) console.log(err);
//       if (err) return next(new Error('Authentication error'));
//       socket.decoded = decoded;
//       next();
//     });
//   }
//   else {
//     next(new Error('Authentication error'));
//   }
// })
// .on('connection', function(socket) {
//     // Connection now authenticated to receive further events

//     io.emit('newMessage', message);
//     socket.on('message', function(message) {
//       io.emit('message', message);
//     });
// });

// module.export = server;
