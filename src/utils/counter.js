const Counter = require("../models/utils/counter");

async function getNextSequence(name) {
  var ret = await Counter.findOneAndUpdate(
    { name: name },
    { $inc: { seq: 1 } },
    { returnOriginal: false, upsert: true }
  );
  return ret.seq;
}

module.exports = getNextSequence;
