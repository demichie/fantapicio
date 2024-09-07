const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static frontend files from public folder

// Socket.io logic here...
server.listen(3000, () => console.log('Server listening on port 3000'));

