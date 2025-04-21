const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = {};

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join', (username) => {
        users[socket.id] = username;
        socket.broadcast.emit('user-joined', username);
        io.emit('update-users', Object.values(users));
        console.log(`${username} joined the chat`);
    });

    socket.on('send-message', (message) => {
        const username = users[socket.id];
        io.emit('receive-message', { username, message });
        console.log(`${username}: ${message}`);
    });

    socket.on('typing', () => {
        const username = users[socket.id];
        socket.broadcast.emit('user-typing', username);
    });

    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            io.emit('user-left', username);
            io.emit('update-users', Object.values(users));
            console.log(`${username} left the chat`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
