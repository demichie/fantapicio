// Ensure the correct modules are imported
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
let currentBid = 1; // Initial bid amount
let timer = null; // Auction timer
let auctionInProgress = false; // Track if an auction is ongoing

const DEFAULT_BUDGET = 500;

// Handle new socket connections
io.on('connection', (socket) => {
    console.log('New connection', socket.id);

    // Handle participant registration
    socket.on('registerParticipant', (name) => {
        if (participants.length < 2 && !participants.find(p => p.name === name)) {
            participants.push({ name, budget: DEFAULT_BUDGET });
            io.emit('participantsUpdate', participants);

            if (participants.length === 2) {
                io.emit('gameReady', participants);
            }
        }
    });

    // Handle player nomination
    socket.on('nominatePlayer', (playerName) => {
        if (!auctionInProgress) {
            currentPlayer = playerName;
            currentBid = 1; // Starting bid
            currentBidder = null; // No one has bid yet
            auctionInProgress = true;
            io.emit('playerNominated', { player: currentPlayer, currentBid });
            startAuctionTimer();
        }
    });

    // Handle bid blocking (timer stopping)
    socket.on('blockTimer', (name) => {
        if (auctionInProgress && !currentBidder) {
            stopAuctionTimer();
            currentBidder = name;
            io.emit('allowBid', { bidder: currentBidder, currentBid });
        }
    });

    // Handle new bids
    socket.on('placeBid', (bidData) => {
        const participant = participants.find(p => p.name === bidData.name);
        if (auctionInProgress && bidData.amount > currentBid && bidData.amount <= participant.budget) {
            currentBid = bidData.amount;
            currentBidder = bidData.name;
            io.emit('bidPlaced', { bidder: currentBidder, amount: currentBid });
            startAuctionTimer(); // Restart the timer after a new bid
            io.emit('allowBid', { bidder: currentBidder, currentBid });
        } else {
            socket.emit('bidError', 'Invalid bid amount or budget.');
        }
    });

    // Handle auction timer
    function startAuctionTimer() {
        let timeLeft = 10;
        io.emit('timerUpdate', timeLeft); // Send the initial 10 seconds to clients

        timer = setInterval(() => {
            timeLeft--;
            io.emit('timerUpdate', timeLeft); // Emit the remaining time every second

            if (timeLeft <= 0) {
                clearInterval(timer); // Stop the timer once it hits 0
                endAuction();
            }
        }, 1000);
    }

    function stopAuctionTimer() {
        clearInterval(timer);
    }

    function endAuction() {
        if (currentBidder) {
            const winner = participants.find(p => p.name === currentBidder);
            winner.budget -= currentBid; // Subtract the bid amount from the winner's budget
            io.emit('auctionEnd', { player: currentPlayer, winner: currentBidder, bid: currentBid });
            io.emit('participantsUpdate', participants);
        }

        // Reset auction state
        currentPlayer = null;
        currentBidder = null;
        currentBid = 1;
        auctionInProgress = false;
    }
});

server.listen(3000, () => console.log('Server listening on port 3000'));

