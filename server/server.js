require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '../client')));

let activeUsers = [];

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join_lobby', (userData) => {
        const newUser = {
            nickname: userData.nickname,
            age: parseInt(userData.age),
            topics: userData.topics,
            lookingForDates: userData.lookingForDates, // NEW: Dating intent
            socketId: socket.id,
            onlineStatus: true
        };
        
        activeUsers.push(newUser);
        io.emit('update_lobby', activeUsers);
    });

    socket.on('send_message', (data) => {
        io.to(data.receiverId).emit('receive_message', {
            senderId: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
    });

    socket.on('disconnect', () => {
        // Mark user as offline instead of deleting them instantly, so DMs still show them!
        const user = activeUsers.find(u => u.socketId === socket.id);
        if(user) user.onlineStatus = false;
        
        // Remove them completely after 5 seconds to keep the lobby clean
        setTimeout(() => {
            activeUsers = activeUsers.filter(u => u.socketId !== socket.id);
            io.emit('update_lobby', activeUsers);
        }, 5000);
        
        io.emit('update_lobby', activeUsers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));