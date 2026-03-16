const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nickname: String,
    topics: [String],
    mood: String,
    socketId: String,
    onlineStatus: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', UserSchema);