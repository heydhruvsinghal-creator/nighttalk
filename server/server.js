require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve frontend files
app.use(express.static(path.join(__dirname, '../client')));

// Connect Database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Real-time Chat Logic
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // When user joins from landing page
    socket.on('join_lobby', async (userData) => {
        const newUser = new User({
            nickname: userData.nickname,
            topics: userData.topics,
            mood: userData.mood,
            socketId: socket.id
        });
        await newUser.save();
        
        // Send all online users to everyone
        const allUsers = await User.find({ onlineStatus: true });
        io.emit('update_lobby', allUsers);
    });

    // Handle private messaging
    socket.on('send_message', (data) => {
        io.to(data.receiverId).emit('receive_message', {
            senderId: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        await User.findOneAndDelete({ socketId: socket.id });
        const allUsers = await User.find({ onlineStatus: true });
        io.emit('update_lobby', allUsers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));