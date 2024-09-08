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
    document.getElementById('name-input-section').style.display = 'none';
    document.getElementById('auction-section').style.display = 'block';
    nominationSection.style.display = 'block';
});

document.getElementById('nominate-button').addEventListener('click', () => {
    const playerName = playerInput.value;
    if (playerName) {
        socket.emit('nominatePlayer', { name: userName, player: playerName });
    }
});

socket.on('playerNominated', (data) => {
    playerInput.value = '';
    currentPlayerEl.textContent = data.player;
    currentBidEl.textContent = data.currentBid;
    currentBidderEl.textContent = data.bidder;
    document.getElementById('nomination-section').style.display = 'none';
    document.getElementById('current-auction').style.display = 'block';
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
});

blockTimerButton.addEventListener('click', () => {
    socket.emit('blockTimer'); // Notify the server to stop the timer
    document.getElementById('bid-section').style.display = 'block';
    document.getElementById('block-section').style.display = 'none';
    bidInput.value = ''; // Clear the previous bid
});

placeBidButton.addEventListener('click', () => {
    const bidAmount = parseInt(bidInput.value);
    if (!isNaN(bidAmount) && bidAmount > 0) {
        bidSection.style.display = 'none'; 
        bidInput.value = ''; // Clear the input field

        socket.emit('placeBid', { name: userName, amount: bidAmount });
    }
});

socket.on('bidPlaced', (data) => {
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
});

socket.on('timerUpdate', (timeLeft) => {
    timerEl.textContent = timeLeft;
});

socket.on('auctionEnd', (data) => {
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    document.getElementById('nomination-section').style.display = 'block';
    document.getElementById('current-auction').style.display = 'none';
    document.getElementById('block-section').style.display = 'none';
    timerEl.textContent = '10'; // Reset timer display
});

socket.on('bidError', (message) => {
    alert(message);
    bidSection.style.display = 'block'; // Show bid section if there was an error
});

