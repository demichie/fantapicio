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
    socket.on('registerParticipant', (name) => {
        participants.push({ name: name, budget: 500, remainingPlayers: 25 });
        io.emit('participantsUpdate', participants);

        if (participants.length > 1) {
            io.emit('gameReady');
        }
    });

    socket.on('nominatePlayer', (data) => {
        currentPlayer = data.player;
        currentBidder = data.name;
        currentBid = 1; // Start bid at 1

        io.emit('playerNominated', {
            player: currentPlayer,
            currentBid: currentBid,
            bidder: currentBidder
        });

        startAuctionTimer();
    });

    socket.on('placeBid', (data) => {
        const bidder = participants.find(p => p.name === data.name);
        
        if (data.amount > currentBid && (data.amount+bidder.remainingPlayers-1 <= bidder.budget ) {
            currentBid = data.amount;
            currentBidder = data.name;

            io.emit('bidPlaced', {
                amount: currentBid,
                bidder: currentBidder
            });

            startAuctionTimer();
        } else {
            socket.emit('bidError', 'Your bid must be higher than the current bid.');
        }
    });

    // Handle blocking the timer
    socket.on('blockTimer', () => {
        stopAuctionTimer(); // Stop the timer immediately when a user blocks the timer

        // Emit an event to allow this user to place a bid
        io.emit('allowBid');
    });

    function startAuctionTimer() {
        stopAuctionTimer(); // Stop any previous timer
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
        if (auctionTimeout) {
            clearInterval(auctionTimeout);
            auctionTimeout = null;
        }
    }

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

        currentPlayer = null;
        currentBid = 1;
        currentBidder = null;

        io.emit('participantsUpdate', participants);
    }
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

