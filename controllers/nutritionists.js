const Nutritionist = require('../models/Nutritionist');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const path = require('path');

// get nutritionists
exports.getNutritionists = asyncHandler(async (req, res, next) => {
  const nutritionists = await Nutritionist.find({
    isConfirmed: true
  });

  res.status(200).json(res.advancedResults);
});

// get one nutritionist
exports.getNutritionist = asyncHandler(async (req, res, next) => {

  const nutritionist = await Nutritionist.findById(req.params.nutritionistId);

  if (!nutritionist) {
    return next(new ErrorResponse('Not found with the id', 404));
  }

  if (!nutritionist.isConfirmed) {
    return next(new ErrorResponse('Not found with the id', 404));
  }

  res.status(200).json({
    success: true,
    data: nutritionist
  });

});

// updating nutritionist, email admin and nutrionist
exports.putNutritionist = asyncHandler(async (req, res, next) => {

  const nutritionist = await Nutritionist.findById(req.params.nutritionistId);

  if (!nutritionist) {
    return next(new ErrorResponse('Not found with the id', 404));
  }

  await nutritionist.update({
    isConfirmed: req.body.isConfirmed
  });

  try {
    await sendEmail({
      email: nutritionist.email,
      subject: 'New Nutritionist',
      message: 'Congratulations, You have been added as a nutritionist'
    });
  } catch (e) {
    return next(new ErrorResponse('Email Not sent', 500));
  }

  res.status(200).json({
    success: true,
    data: nutritionist
  });

});

exports.deleteNutritionist = asyncHandler(async (req, res, next) => {

  const nutritionist = await Nutritionist.findById(req.params.nutritionistId);

  if (!nutritionist) {
    return next(new ErrorResponse('Not found with the id', 404));
  }

  await nutritionist.remove();
  res.status(200)
    .json({
      success: true,
      msg: 'Nutritionist is deleted.'
    });

});

exports.putPhoto = asyncHandler(async (req, res, next) => {

  let findId;

  if (req.user.userType === 'admin') {
    findId = req.params.nutritionistId;
  } else if (req.user.userType === 'nutritionist') {
    findId = req.user.id;
  }

  const user = await Nutritionist.findById(findId);

  if (!user.isConfirmed) {
    return next(new ErrorResponse('Nutritionist is not confirmed', 401));
  }

  if (!user) {
    return next(new ErrorResponse('No user found', 404));
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload file', 404));
  }

  const file = req.files.file;

  if (!file.mimetype.startsWith('image')) {
    new ErrorResponse('Please upload an image file', 400);
  }

  // check file size
  if (file.size < process.env.MAX_FILE_UPLOAD) {
    new ErrorResponse(
      `Please upload an image file less than ${process.env.MAX_FILE_UPLOAD}`,
      400
    );
  }

  // generate custom filename 
  file.name = `photo_${user._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(
        'Problem with the file upload', 500)
      );
    }

    await Nutritionist.findByIdAndUpdate(req.params.id, {
      photo: file.name
    });

    res.status(200)
      .json({
        success: true,
        data: file.name
      })
  });

});

// find by location
exports.getNutritionistsByLocation(async (req, res, next) => {

});