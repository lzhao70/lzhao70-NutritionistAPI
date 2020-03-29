const express = require('express');
const Router = express.Router();

const {
  postRegister,
  postLogin,
  getDetails,
  postReset,
  putReset,
  putDetails,
  postLogout
} = require('../controllers/auth');

// auth and protection middleware
const {
  protect
} = require('../middlewares/auth')

Router.post('/register', postRegister);
Router.post('/login', postLogin);
Router.get('/details', protect, getDetails);
Router.post('/resetpassword', postReset);
Router.put('/resetpassword/:resettoken', putReset);
Router.put('/details', protect, putDetails);
Router.post('/logout', postLogout);

module.exports = Router;


