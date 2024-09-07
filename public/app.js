// app.js

const socket = io();
let userName = null;

const nameInputSection = document.getElementById('name-input-section');
const auctionSection = document.getElementById('auction-section');
const participantsList = document.getElementById('participants-list');
const playerInput = document.getElementById('player-input');
const currentPlayerEl = document.getElementById('current-player');
const currentBidEl = document.getElementById('current-bid');
const currentBidderEl = document.getElementById('current-bidder');
const timerEl = document.getElementById('timer');
const blockTimerButton = document.getElementById('block-timer-button');
const bidSection = document.getElementById('bid-section');
const bidInput = document.getElementById('bid-input');
const placeBidButton = document.getElementById('place-bid-button');

// Event listener for joining the auction
document.getElementById('join-button').addEventListener('click', () => {
    const nameInput = document.getElementById('name-input').value;
    if (nameInput) {
        userName = nameInput;
        socket.emit('registerParticipant', userName);
        nameInputSection.style.display = 'none';
    }
});

// Update the participant list
socket.on('participantsUpdate', (participants) => {
    participantsList.innerHTML = '';
    participants.forEach((participant) => {
        const li = document.createElement('li');
        li.textContent = `${participant.name} - Budget: ${participant.budget}`;
        participantsList.appendChild(li);
    });
});

// Notify when the game is ready
socket.on('gameReady', () => {
    auctionSection.style.display = 'block';
});

// Handle player nomination
document.getElementById('nominate-button').addEventListener('click', () => {
    const playerName = playerInput.value;
    if (playerName) {
        socket.emit('nominatePlayer', playerName);
        playerInput.value = '';
    }
});

// Update the current player and hide bid section
socket.on('playerNominated', (data) => {
    currentPlayerEl.textContent = data.player;
    currentBidEl.textContent = data.currentBid;
    currentBidderEl.textContent = 'None';
    document.getElementById('current-auction').style.display = 'block';
    bidSection.style.display = 'none'; // Hide bid section until a bid is allowed
});

// Block the timer when the button is clicked
blockTimerButton.addEventListener('click', () => {
    socket.emit('blockTimer', userName);
});

// Allow the user to place a bid if they are the one who blocked the timer
socket.on('allowBid', () => {
    bidSection.style.display = 'block';
    bidInput.value = ''; // Clear any previous bid
});

// Place a bid and show an alert with bid details
placeBidButton.addEventListener('click', () => {
    const bidAmount = parseInt(bidInput.value);
    if (!isNaN(bidAmount) && bidAmount > 0) {
        bidSection.style.display = 'none';
        socket.emit('placeBid', { name: userName, amount: bidAmount });

        // Hide bid section and clear input after bid is placed
        bidInput.value = '';
    }
});

// Update the current bid and bidder information
socket.on('bidPlaced', (data) => {
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    blockTimerButton.style.display = 'block'; // Show block timer button for the next round
});

// Update the timer display
socket.on('timerUpdate', (timeLeft) => {
    timerEl.textContent = timeLeft;
});

// Notify when the auction ends
socket.on('auctionEnd', (data) => {
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    document.getElementById('current-auction').style.display = 'none';
    timerEl.textContent = '10'; // Reset timer display
});

// Handle bid errors and display alerts
socket.on('bidError', (message) => {
    alert(message);
    bidSection.style.display = 'block'; // Show bid section if there was an error
});


