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

document.getElementById('join-button').addEventListener('click', () => {
    const nameInput = document.getElementById('name-input').value;
    if (nameInput) {
        userName = nameInput;
        socket.emit('registerParticipant', userName);
        nameInputSection.style.display = 'none';
    }
});

socket.on('participantsUpdate', (participants) => {
    participantsList.innerHTML = '';
    participants.forEach((participant) => {
        const li = document.createElement('li');
        li.textContent = `${participant.name} - Budget: ${participant.budget}`;
        participantsList.appendChild(li);
    });
});

socket.on('gameReady', () => {
    auctionSection.style.display = 'block';
});

document.getElementById('nominate-button').addEventListener('click', () => {
    const playerName = playerInput.value;
    if (playerName) {
        socket.emit('nominatePlayer', playerName);
        playerInput.value = '';
    }
});

socket.on('playerNominated', (data) => {
    currentPlayerEl.textContent = data.player;
    currentBidEl.textContent = data.currentBid;
    currentBidderEl.textContent = 'None';
    document.getElementById('current-auction').style.display = 'block';
    bidSection.style.display = 'none';
});

blockTimerButton.addEventListener('click', () => {
    socket.emit('blockTimer', userName);
});

socket.on('allowBid', (data) => {
    if (data.bidder === userName) {
        bidSection.style.display = 'block';
    }
});

document.getElementById('place-bid-button').addEventListener('click', () => {
    const bidAmount = parseInt(bidInput.value);
    console.log('Placing bid:', bidAmount); // Log bid amount
    if (bidAmount > currentBid && !isNaN(bidAmount)) {
        socket.emit('placeBid', { name: userName, amount: bidAmount });
        bidInput.value = '';
        bidSection.style.display = 'none';
    }
});

socket.on('bidPlaced', (data) => {
    console.log('Bid placed:', data); // Log bid placed event
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    blockTimerButton.style.display = 'block'; 
});

socket.on('timerUpdate', (timeLeft) => {
    timerEl.textContent = timeLeft; // Update the displayed time
});

socket.on('auctionEnd', (data) => {
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    document.getElementById('current-auction').style.display = 'none';
    timerEl.textContent = '10'; // Reset timer display
});

socket.on('bidError', (message) => {
    alert(message); // Display bid error message
});

