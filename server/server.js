require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 1e8 }); // Allows image uploads

app.use(express.static(path.join(__dirname, '../client')));

// OUR RAM DATABASE
let registeredUsers = []; 

io.on('connection', (socket) => {
    
    // SIGN UP
    socket.on('signup', (userData) => {
        const exists = registeredUsers.find(u => u.username === userData.username);
        if(exists) return socket.emit('auth_error', 'username already taken 💀');

        const newUser = { ...userData, socketId: socket.id, onlineStatus: true };
        registeredUsers.push(newUser);
        
        socket.emit('auth_success', newUser);
        io.emit('update_lobby', registeredUsers);
    });

    // LOG IN
    socket.on('login', (credentials) => {
        const user = registeredUsers.find(u => u.username === credentials.username && u.password === credentials.password);
        if(!user) return socket.emit('auth_error', 'wrong username or password bestie 🛑');

        user.socketId = socket.id; // Update their current connection
        user.onlineStatus = true;
        
        socket.emit('auth_success', user);
        io.emit('update_lobby', registeredUsers);
    });

    // MESSAGES & REQUESTS
    socket.on('send_message', (data) => {
        io.to(data.receiverId).emit('receive_message', {
            senderId: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
    });

    socket.on('request_accepted', (data) => {
        io.to(data.senderId).emit('request_accepted_notification', { accepterId: socket.id });
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        const user = registeredUsers.find(u => u.socketId === socket.id);
        if(user) {
            user.onlineStatus = false;
            io.emit('update_lobby', registeredUsers);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));