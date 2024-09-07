const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from 'public' directory

// Participant data structure
let participants = [
  { name: 'Alice', budget: 500, playersBought: 0 },
  { name: 'Bob', budget: 500, playersBought: 0 },
  { name: 'Charlie', budget: 500, playersBought: 0 }
];

// Current offer and auction details
let currentOffer = { participant: null, amount: 0 };

// Send participant data to clients
io.on('connection', (socket) => {
  // Send participants and budget to the client
  socket.emit('participantsUpdate', participants);

  socket.on('newBid', (data) => {
    const participant = participants.find(p => p.name === data.participant);
    
    if (participant && data.amount > currentOffer.amount && data.amount <= participant.budget) {
      // Update offer and restart auction
      currentOffer = { participant: data.participant, amount: data.amount };
      io.emit('newOffer', currentOffer);

      // Update participant's budget
      participant.budget -= data.amount;
      participant.playersBought += 1;

      // Send updated participants data to all clients
      io.emit('participantsUpdate', participants);
    }
  });

  socket.on('endAuction', () => {
    io.emit('auctionEnd', currentOffer);
  });
});

server.listen(3000, () => console.log('Server listening on port 3000'));

