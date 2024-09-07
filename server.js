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

app.use(express.static('public'));

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
    socket.on('nominatePlayer', (player) => {
        currentPlayer = player;
        currentBid = 1; // Starting bid of 1
        currentBidder = socket.id; // The nominator is the first bidder

        const nominator = participants.find(p => p.name === socket.id);

        io.emit('playerNominated', {
            player: currentPlayer,
            currentBid: currentBid,
            bidder: nominator ? nominator.name : 'Unknown'
        });
        // Start the auction timer after nomination
        startAuctionTimer();
    });

    // Handle bid blocking (timer stopping)
    socket.on('blockTimer', (name) => {
        if (auctionInProgress && !currentBidder) {
            stopAuctionTimer();
            currentBidder = name;
            // io.emit('allowBid', { bidder: currentBidder, currentBid });
        }
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

        const interval = setInterval(() => {
            io.emit('timerUpdate', timeLeft);
            if (timeLeft <= 0) {
                clearInterval(interval);
                auctionEnd();
            }
            timeLeft--;
        }, 1000);

        auctionTimeout = interval;
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
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

