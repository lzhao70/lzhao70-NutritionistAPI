const express = require('express')
const router = express.Router();
const advancedResults = require('../middlewares/advancedResults');
const Nutritionist = require('../models/Nutritionist');

const {
  getNutritionists,
  getNutritionist,
  putNutritionist,
  deleteNutritionist,
  putPhoto
} = require('../controllers/nutritionists');

// authorize 
const {
  protect,
  authorize
} = require('../middlewares/auth');

router.route('/')
  .get(advancedResults(Nutritionist), getNutritionists);

router.route('/:nutritionistId')
  .get(getNutritionist)
  .put(protect, authorize('admin'), putNutritionist)
  .delete(protect, authorize('admin'), deleteNutritionist);

router.put('/:nutritionistId/photo', protect, authorize('admin', 'nutritionist'), putPhoto);

module.exports = router;