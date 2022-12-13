const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const StaticFile = require("../../../../models/static_file");

router.get("/", async (req, res) => {
  console.log("Got query:", req.query);

  try {
    let pageName = req.query.pageName;
    if (pageName != undefined) {
      data = await StaticFile.find({'pageName': pageName});
    } else {
      data = await StaticFile.find({});
    }
    res.status(200).send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});



module.exports = router;
