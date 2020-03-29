const mongoose = require('mongoose');
const BaseUser = require('./BaseUser');

const User = BaseUser.discriminator('user', new mongoose.Schema({
}));

module.exports = User;