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
        socket.emit('registerParticipant', userName);  // Emit the event to the server to register the participant
        nameInputSection.style.display = 'none';  // Hide the name input section after joining
        auctionSection.style.display = 'block';  // Show the auction section once the user joins
    } else {
        alert('Please enter a name to join the auction.');
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
    nominationSection.style.display = 'block';  // Show the player nomination section once the game is ready
});

// Handle player nomination
document.getElementById('nominate-button').addEventListener('click', () => {
    const playerName = playerInput.value;
    if (playerName) {
        socket.emit('nominatePlayer', { name: userName, player: playerName });  // Send the player nomination to the server
    } else {
        alert('Please enter a player name.');
    }
});

// Update the current player and hide bid section until allowed
socket.on('playerNominated', (data) => {
    playerInput.value = '';  // Clear the input field after nomination
    currentPlayerEl.textContent = data.player;
    currentBidEl.textContent = data.currentBid;
    currentBidderEl.textContent = data.bidder;
    nominationSection.style.display = 'none';
    document.getElementById('current-auction').style.display = 'block';
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
});

// Block the timer when the button is clicked
blockTimerButton.addEventListener('click', () => {
    document.getElementById('bid-section').style.display = 'block';
    document.getElementById('block-section').style.display = 'none';
    bidInput.value = '';  // Clear any previous bid
});

// Allow the user to place a bid if they are the one who blocked the timer
socket.on('allowBid', () => {
    bidSection.style.display = 'block';
    bidInput.value = '';  // Clear any previous bid
});

// Place a bid and show an alert with bid details
placeBidButton.addEventListener('click', () => {
    const bidAmount = parseInt(bidInput.value);
    if (!isNaN(bidAmount) && bidAmount > 0) {
        // Hide bid section before placing bid
        bidSection.style.display = 'none';
        bidInput.value = '';  // Clear the input field

        // Optionally, show an alert with the bid details
        alert(`Placing bid: ${bidAmount}\nCurrent bid: ${currentBidEl.textContent}`);

        // Emit the placeBid event with the user's name and bid amount
        socket.emit('placeBid', { name: userName, amount: bidAmount });
    } else {
        alert('Please enter a valid bid.');
    }
});

// Update the current bid and bidder information
socket.on('bidPlaced', (data) => {
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    document.getElementById('nomination-section').style.display = 'none';
    document.getElementById('current-auction').style.display = 'block';
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
});

// Update the timer display
socket.on('timerUpdate', (timeLeft) => {
    timerEl.textContent = timeLeft;
});

// Notify when the auction ends
socket.on('auctionEnd', (data) => {
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    document.getElementById('nomination-section').style.display = 'block';
    document.getElementById('current-auction').style.display = 'none';
    document.getElementById('block-section').style.display = 'none';
    document.getElementById('bid-section').style.display = 'none';
    timerEl.textContent = '10';  // Reset timer display
});

// Handle bid errors and display alerts
socket.on('bidError', (message) => {
    alert(message);
    bidSection.style.display = 'block';  // Show bid section if there was an error
});

