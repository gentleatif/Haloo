const cloudinary = require("cloudinary").v2;

upload = async (imgPath) => {
  const result = await cloudinary.uploader.upload(imgPath);
  return result.secure_url;
};

module.exports = upload;
