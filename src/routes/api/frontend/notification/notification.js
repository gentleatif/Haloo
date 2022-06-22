const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../../../../models/notification/notification");

router.get("/", async (req, res) => {
  try {
    //find all notifications with aggregate and return only 20 latest notifications
    let data = await Notification.aggregate([
      {
        $match: {
          customerId: mongoose.Types.ObjectId(req.customer._id),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $limit: 20 },
    ]);
    res.send({ data: data });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/", async (req, res) => {
  // console message and title
  const { message, title } = req.body;
  console.log(message, title);
  try {
    const notification = await Notification.create({
      customerId: req.customer._id,
      notification: {
        title: title,
        message: message,
      },
    });
    res.send(notification);
  } catch (error) {
    res.status(400).send(error);
  }
});
// update notification update need to be updated according to requirements
router.post("/update", async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.body.id,
    });
    notification.isRead = true;
    await notification.save();
    res.send(notification);
  } catch (error) {
    res.send(error);
  }
});

module.exports = router;
