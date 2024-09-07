const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static frontend files from public folder

let participants = []; // Track participants {name, budget}
let currentPlayer = null; // The player being auctioned
let currentBidder = null; // Track who is allowed to bid
let currentBid = 0; // Track current bid
let timer = null; // Auction timer

// Default budget
const DEFAULT_BUDGET = 500;

// Handle new socket connections
io.on('connection', (socket) => {
  console.log('New connection', socket.id);

  // Handle participant registration
  socket.on('registerParticipant', (name) => {
    if (participants.length < 2 && !participants.find(p => p.name === name)) {
      participants.push({ name, budget: DEFAULT_BUDGET });
      io.emit('participantsUpdate', participants);

      // If there are now 2 participants, begin the game
      if (participants.length === 2) {
        io.emit('gameReady', participants);
      }
    }
  });

  // Handle player nomination
  socket.on('nominatePlayer', (playerName) => {
    currentPlayer = playerName;
    currentBid = 1; // Starting bid
    currentBidder = null; // No one has bid yet
    io.emit('playerNominated', { player: currentPlayer, currentBid });
    startAuctionTimer();
  });

  // Handle bid blocking (timer stopping)
  socket.on('blockTimer', (name) => {
    if (!currentBidder) {
      stopAuctionTimer();
      currentBidder = name;
      io.emit('allowBid', { bidder: currentBidder, currentBid });
    }
  });

  // Handle new bids
  socket.on('placeBid', (bidData) => {
    const participant = participants.find(p => p.name === bidData.name);
    if (bidData.amount > currentBid && bidData.amount <= participant.budget) {
      currentBid = bidData.amount;
      currentBidder = bidData.name;
      participant.budget -= currentBid;
      io.emit('bidPlaced', { bidder: currentBidder, amount: currentBid });
      io.emit('participantsUpdate', participants);
      startAuctionTimer(); // Restart the timer after a new bid
    }
  });

  // Handle auction timer
  function startAuctionTimer() {
    let timeLeft = 10;
    timer = setInterval(() => {
      timeLeft--;
      io.emit('timerUpdate', timeLeft);
      if (timeLeft === 0) {
        clearInterval(timer);
        endAuction();
      }
    }, 1000);
  }

  function stopAuctionTimer() {
    clearInterval(timer);
  }

  function endAuction() {
    io.emit('auctionEnd', { player: currentPlayer, winner: currentBidder, bid: currentBid });
    currentPlayer = null;
    currentBidder = null;
    currentBid = 0;
  }
});

server.listen(3000, () => console.log('Server listening on port 3000'));

