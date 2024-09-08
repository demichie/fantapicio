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
            io.emit('gameReady');
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
        startAuctionTimer();
    });

    // Handle placing bids
    socket.on('placeBid', (data) => {
        const bidder = participants.find(p => p.name === data.name);
        
        if (data.amount > currentBid) {
            socket.emit('bidError', 'Your bid must be higher than the current bid.');
        } else if ( data.amount+bidder.remainingPlayers-1 <= bidder.budget) {
            socket.emit('bidError', 'Your bid must be smaller.');
        } else {
            currentBidder = data.name;

            io.emit('bidPlaced', {
                amount: currentBid,
                bidder: currentBidder
            });

            startAuctionTimer();
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

    function stopAuctionTimer() {
        clearInterval(auctionTimeout);
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

    // Handle timer block
    socket.on('blockTimer', (name) => {
        currentBidder = name;
        io.emit('blockTimer', currentBidder);
        stopAuctionTimer();
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

