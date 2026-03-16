require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve frontend files
app.use(express.static(path.join(__dirname, '../client')));

// 🧠 OUR "FAKE" DATABASE (Saves in RAM)
let activeUsers = [];

// Real-time Chat Logic
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // --- THIS IS WHERE THE NEW CODE WENT! ---
    // When user joins from the landing page
    socket.on('join_lobby', (userData) => {
        const newUser = {
            nickname: userData.nickname,
            age: userData.age,           // <--- We added Age here!
            topics: userData.topics,
            socketId: socket.id,
            onlineStatus: true
        };
        
        activeUsers.push(newUser); // Save user to RAM
        io.emit('update_lobby', activeUsers); // Update everyone's screen
    });
    // ----------------------------------------

    // Handle messages
    socket.on('send_message', (data) => {
        io.to(data.receiverId).emit('receive_message', {
            senderId: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // Handle disconnect (When they close the tab)
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from RAM
        activeUsers = activeUsers.filter(user => user.socketId !== socket.id);
        io.emit('update_lobby', activeUsers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));