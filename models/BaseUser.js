const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const geocoder = require('../utils/geocoder');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const baseOptions = {
  discriminatorKey: 'userType',
  collection: 'users',
};

const BaseUserSChema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [
        true,
        'Please add a first name'
      ]
    },
    lastName: {
      type: String,
      required: [
        true,
        'Please add a last name'
      ]
    },
    email: {
      type: String,
      required: [
        true,
        'Please add an email'
      ],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    password: {
      type: String,
      required: [
        true,
        'Please add a password'
      ],
      minlength: 6,
      select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    address: {
      type: String,
      required: [true, 'Please add an address']
    },
    phone: {
      type: String,
      required: [
        true,
        'Please add a phone number'
      ],
      unique: true,
      maxlength: [20, 'Phone number can not be longer than 20 characters']
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String
    }
  },
  baseOptions,
);

// encrypt passwords
BaseUserSChema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// match passwords
BaseUserSChema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

// create a signed token with jwt
BaseUserSChema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE });
};

BaseUserSChema.pre('save', async function (next) {
  if (!this.isModified('address')) {
    next();
  }

  const loc = await geocoder.geocode(this.address);

  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  };

  next();
});

// Generate and hash password token
BaseUserSChema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('BaseUser', BaseUserSChema);
