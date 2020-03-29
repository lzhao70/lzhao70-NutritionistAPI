const mongoose = require('mongoose');
const BaseUser = require('./BaseUser');

const Nutritionist = BaseUser.discriminator('nutritionist', new mongoose.Schema({
  slug: String,
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must can not be more than 10']
  },
  isConfirmed: Boolean,
  photo: String
}));

module.exports = Nutritionist;
