const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Nutritionist = require('../models/Nutritionist');
const User = require('../models/User');
const BaseUser = require('../models/BaseUser');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// user registration
exports.postRegister = asyncHandler(async (req, res, next) => {

  const { firstName, lastName, email, password, role, address, phone } = req.body;

  if (role == 'nutritionist') {

    const nutritionist = await Nutritionist.create({
      firstName,
      lastName,
      email,
      password,
      address,
      phone
    });
    return sendTokenResponse(nutritionist, 200, res, 'Nutritionist was created');

  } else if (role == 'user') {

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      address,
      phone
    });
    return sendTokenResponse(user, 200, res, 'User was created');

  } else {
    return next(new ErrorResponse('User must be a nutritionist or a user', 400));
  }

});

// user login
exports.postLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await BaseUser.findOne({ email })
    .select('+password');

  // check user
  if (!user) {
    return next(new ErrorResponse('Invalid user.', 401));
  }

  // check user nutritionist and not confirmed
  if (user.userType === 'nutritionist' && !user.isConfirmed) {
    return next(new ErrorResponse('Nutritionist has not been validated.', 401));
  }

  // check password 
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('The password does not match', 401));
  }

  sendTokenResponse(user, 200, res, 'Logged In');

});

// post reset password
exports.postReset = asyncHandler(async (req, res, next) => {
  const user = await BaseUser.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('No user found.', 404));
  }

  // get a reset token 
  const resetToken = user.getResetPasswordToken();

  await user.save({
    validateBeforeSave: false
  });

  // create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email to reset your password.
    ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset',
      message
    });

    res.status(200)
      .json({
        success: true,
        data: 'Email sent'
      });

  } catch (e) {
    console.log(e);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({
      validateBeforeSave: false
    });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// put reset password
exports.putReset = asyncHandler(async (req, res, next) => {
  // get hashed token from db
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // find user
  const user = await BaseUser.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new errorResponse('Invalid Token', 400));
  }

  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({
    validateBeforeSave: false
  });

  res.status(200)
    .json({
      success: true,
      data: 'Password was reset'
    });
});

// get details
exports.getDetails = asyncHandler(async (req, res, next) => {
  // protection on details
  if (req.user.role == 'nutritionist' && !req.user.isConfirmed) {
    return next(new ErrorResponse('Nutritionist details not allowed to be fetched.'));
  }

  const user = await baseUsers.findById(req.user.id);
  res.status(200)
    .json({
      success: true,
      data: user
    });

});

// update details, ensure route protection
exports.putDetails = asyncHandler(async (req, res, next) => {

  // check user nutritionist and not confirmed
  if (req.user.userType === 'nutritionist' && !req.user.isConfirmed) {
    return next(new ErrorResponse('Nutritionist has not been validated.', 401));
  }

  const allowedFieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    address: req.body.address,
    phone: req.body.phone
  };

  const user = await BaseUser.findByIdAndUpdate(req.user.id, allowedFieldsToUpdate, {
    new: true,
    runValidators: true
  });

  await user.save();

  res.status(200)
    .json({
      success: true,
      data: user
    });
});

// function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, msg) => {
  // method for token
  const token = user.getSignedToken();

  // cookie options
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  // secure for https production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      msg
    });
};

exports.postLogout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 10000),
    httpOnly: true
  });

  res.status(200)
    .json({
      success: true,
      data: {}
    });
});