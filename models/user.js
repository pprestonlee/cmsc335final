const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    favoriteJoke: { type: String }
}, { 
    collection: 'userData'
});

module.exports = mongoose.model('User', UserSchema);