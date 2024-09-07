const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let participants = [];
let currentPlayer = null;
let currentBid = 1;
let currentBidder = null;
let auctionTimeout = null;
let timer = null;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
    // Handle participant registration
    socket.on('registerParticipant', (name) => {
        participants.push({ name: name, budget: 500, remainingPlayers: 25 });
        io.emit('participantsUpdate', participants);
        
        if (participants.length > 1) {
            io.emit('gameReady'); // Start the game when there are at least 2 participants
        }
    });

    // Handle player nomination
    socket.on('nominatePlayer', (data) => {    
        currentPlayer = data.player;
        currentBidder = data.name;
        currentBid = 1; // Starting bid of 1

        io.emit('playerNominated', {
            player: currentPlayer,
            currentBid: currentBid,
            bidder: currentBidder
        });

        // Start the auction timer after nomination
        startAuctionTimer();
    });

    // Handle placing bids
    socket.on('placeBid', (data) => {
        if (data.amount > currentBid) {
            currentBid = data.amount;
            currentBidder = data.name;

            io.emit('bidPlaced', {
                amount: currentBid,
                bidder: currentBidder
            });

            // Restart the timer after a new bid is placed
            startAuctionTimer();
        } else {
            socket.emit('bidError', 'Your bid must be higher than the current bid.');
        }
    });

    // Timer functionality
    function startAuctionTimer() {
        if (auctionTimeout) clearTimeout(auctionTimeout);
        let timeLeft = 10;

        timer = setInterval(() => {
            io.emit('timerUpdate', timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timer);
                auctionEnd();
            }
            timeLeft--;
        }, 1000);
    }

    // Handle auction end
    function auctionEnd() {
        const winner = participants.find(p => p.name === currentBidder);
        if (winner) {
            winner.budget -= currentBid;
            winner.remainingPlayers -= 1;
        }

        io.emit('auctionEnd', {
            winner: currentBidder,
            player: currentPlayer,
            bid: currentBid
        });

        // Reset the auction for the next player nomination
        currentPlayer = null;
        currentBid = 1;
        currentBidder = null;

        io.emit('participantsUpdate', participants);
    }

    // Disconnect event handling if needed
    socket.on('disconnect', () => {
        // Optional: handle disconnection if necessary (e.g., remove participant)
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

