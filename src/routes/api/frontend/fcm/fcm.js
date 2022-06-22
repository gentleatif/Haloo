const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
// need this service account to send notification
const serviceAccount = require("./serviceAccountKey.json");
// you need to change databaseURL to your firebase database url
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sample-project-e1a84.firebaseio.com",
});

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24,
};
function sendNotification(registrationToken, payLoad) {
  // payload format:
  // {
  //   notification: {
  //     title: "",
  //     body: "",
  //     }

  const options = notification_options;
  admin
    .messaging()
    .sendToDevice(registrationToken, payLoad, options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
}

module.exports = sendNotification;
