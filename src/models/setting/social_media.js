var mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
    facebookPageUrl: {
        type: String,
    },
    linkedInUrl: {
        type: String,
    },
    InstagramUrl: {
      type: String,
    },
    youtubeUrl: {
      type: String,
    },
    fbApplicationId: {
        type: String,
    },
    fbSecretKey: {
        type: String,
    },
    googleApplicationId: {
        type: String,
    },
    googleSecretKey: {
        type: String,
    },
    googlePlayStoreUrl: {
        type: String,
    },
    appleAppStoreUrl: {
        type: String,
    },
  },
    {
      timestamps: true
    });
  
  const SocialMedia = mongoose.model('socialMedia', socialMediaSchema)
  module.exports = SocialMedia; 

