const express = require("express");
const router = express.Router();
const Contactus = require("../../../../models/contactus");
// get review
router.post("/", async (req, res) => {
  const { name, phone, message } = req.body;

  // phone no
  if (!phone) {
    return res
      .status(400)
      .send({ error: "Phone number is required", field: "phone" });
  }
  if (phone.length != 10) {
    return res
      .status(400)
      .send({ error: "Phone number length should be 10", field: "phone" });
  }
  let phoneRegExp = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegExp.test(phone)) {
    return res.status(400).send({
      error: "Phone number must be E.164 format without country code",
      field: "phone",
    });
  }
  // name validation
  if (name.length < 3) {
    return res.send({ error: "Invalid name value" });
  }

  const contactInfo = new Contactus({
    name: req.body.name,
    phone: req.body.phone,
    message: req.body.message,
  });
  contactInfo
    .save()
    .then(function (item) {
      res.sendStatus(200);
    })
    .catch((error) => {
      //error handle
      console.log(error);
      res.sendStatus(400);
    });
});

router.get("/", async (req, res) => {
  try {
    const columnName = req.query.columnName;
    const sort = req.query.sort;
    const query = { [columnName]: parseInt(sort) };
    console.log(query);
    const data = await Contactus.find().sort(query);
    res.send({ data: data });
  } catch (error) {
    res.sendStatus(400);
  }
});
module.exports = router;
