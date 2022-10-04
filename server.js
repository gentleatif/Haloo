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
var multer = require("multer");
const useragent = require("express-useragent");
const cloudinary = require("cloudinary");

//creating express intances
const app = express();
// cloudinary
cloudinary.config({
  cloud_name: "dvpcv7poi",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// log all requests to the console
app.use(function (req, res, next) {
  console.log(req.method, req.url);

  next();
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(useragent.express());
app.use("/uploads", express.static("./uploads"));
const corsOpts = {
  origin: "*",
  // all method
  methods: ["GET", "POST", "PUT", "DELETE"],

  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOpts));
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

const port = process.env.PORT || 8000;
// create http server and run socket io
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// run socket io
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// listen to connection
io.on("connect", (socket) => {
  console.log("New client connected");
  // save socket id of user to mongodb
  socket.on("save-socket-id", (data) => {
    console.log(data);
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
          // reply back to same socket
          socket.emit("socket-id-saved", {
            socketId: customer.socketId,
          });
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
