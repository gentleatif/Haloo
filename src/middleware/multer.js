const multer = require("multer");
const path = require("path");
const Master = require("../models/setting/master");
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads/images/');
//       },
//     filename: function (req, file, cb) {
//         // console.log(file);
//         cb(null, Date.now() + file.originalname);
//     }
// });

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("type", req.body.type);
    cb(null, "uploads/images/" + file.fieldname + "/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// const upload = multer({ //multer settings
//     storage: storage,
//     // fileFilter: (req, file, cb) => {
//     //     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
//     //       cb(null, true);
//     //     } else {
//     //       cb(null, false);
//     //       return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
//     //     }
//     // }
// })

const maxSize = 1 * 1024 * 1024; // for 1MB

var upload = multer({
  storage: storage,
  fileFilter: async (req, file, cb) => {
    var ext = path.extname(file.originalname);
    console.log("ext", ext);

    // validate extension from store mongodb ext
    let data = await Master.findOne({});
    console.log("master data ===>", data);

    let validImageExtensions = data.validImageExtensions;
    console.log("validImageExtensions", validImageExtensions);
    console.log(
      "ext comparison ==>",
      validImageExtensions.indexOf(ext.substring(1))
    );

    if (validImageExtensions.indexOf(ext.substring(1)) === -1) {
      cb(null, false);
      console.log("invalid extension");
      return cb(
        new Error(
          "Only " + validImageExtensions + " are allowed with maxsize 1MB"
        )
      );
    } else {
      console.log("valid extension");
      cb(null, true);
    }

    // if (
    //   file.mimetype == "image/png" ||
    //   file.mimetype == "image/jpg" ||
    //   file.mimetype == "image/jpeg"
    // ) {
    //   cb(null, true);
    // } else {
    //   cb(null, false);
    //   return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    // }
  },
  limits: { fileSize: maxSize },
});

module.exports = upload;
