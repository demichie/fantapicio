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
const nominationSection = document.getElementById('nomination-section');
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
        auctionSection.style.display = 'block'; // Show the auction section after joining
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
    document.getElementById('name-input-section').style.display = 'none';
    document.getElementById('auction-section').style.display = 'block';
    nominationSection.style.display = 'block'; // Show nomination section when the game is ready
});

// Handle player nomination
document.getElementById('nominate-button').addEventListener('click', () => {
    const playerName = playerInput.value;
    if (playerName) {
        socket.emit('nominatePlayer', { name: userName, player: playerName });
    }
});

// Update the current player and hide bid section until allowed
socket.on('playerNominated', (data) => {
    playerInput.value = ''; // Clear the input field
    currentPlayerEl.textContent = data.player;
    currentBidEl.textContent = data.currentBid;
    currentBidderEl.textContent = data.bidder;
    nominationSection.style.display = 'none'; // Hide nomination section after nomination
    document.getElementById('current-auction').style.display = 'block';
    document.getElementById('block-section').style.display = 'block';
    bidSection.style.display = 'none'; // Hide bid section until timer is blocked
});

// Block the timer when the button is clicked
blockTimerButton.addEventListener('click', () => {
    document.getElementById('bid-section').style.display = 'block';
    document.getElementById('block-section').style.display = 'none';
    bidInput.value = ''; // Clear any previous bid
});

// Place a bid and show an alert with bid details
placeBidButton.addEventListener('click', () => {
    const bidAmount = parseInt(bidInput.value);
    if (!isNaN(bidAmount) && bidAmount > 0) {
        bidSection.style.display = 'none'; // Hide bid section before placing bid
        bidInput.value = ''; // Clear the input field

        // Emit the placeBid event with the user's name and bid amount
        socket.emit('placeBid', { name: userName, amount: bidAmount });
    }
});

// Update the current bid and bidder information
socket.on('bidPlaced', (data) => {
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    bidSection.style.display = 'none';
    document.getElementById('block-section').style.display = 'block';
});

// Update the timer display
socket.on('timerUpdate', (timeLeft) => {
    timerEl.textContent = timeLeft;
});

// Notify when the auction ends
socket.on('auctionEnd', (data) => {
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    nominationSection

