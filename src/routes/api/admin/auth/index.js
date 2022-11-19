const express = require("express");
const router = express.Router();

router.use("/admin", require("./admin"));
router.use("/customer", require("./customer"));
router.get("/", (req, res) => {
  res.send("Hello World!");
});
// router.use('/vendor', require('./vendor'));
module.exports = router;
