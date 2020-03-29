const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler')
const errorResponse = require('../utils/errorResponse');
const BaseUser = require('../models/BaseUser');

// protect routes
exports.protect = asyncHandler(async (req, res, next) => {

  let token;

  if (req.headers.authorization
    && req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // make sure token exists 
  if (!token) {
    return next(new errorResponse('Not authorized in the route', 401));
  }

  try {
    // verify token 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await BaseUser.findById(decoded.id);
    next();
  } catch (e) {
    return next(new errorResponse('Not authorized in the route', 401));
  }

});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return next(
        new errorResponse(
          `User role ${req.user.userType} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};