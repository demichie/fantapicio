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
    nominationSection.style.display = 'block';
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
    socket.emit('blockTimer', userName);
});

// Update the button text and timer
socket.on('blockTimer', (bidderName) => {
    blockTimerButton.textContent = `${bidderName} is bidding`;
    blockTimerButton.classList.add('red');
    document.getElementById('bid-section').style.display = 'block';
    document.getElementById('block-section').style.display = 'none';
});

// Place a bid
placeBidButton.addEventListener('click', () => {
    const bidAmount = parseInt(bidInput.value);
    if (!isNaN(bidAmount) && bidAmount > 0) {
        bidSection.style.display = 'none';
        bidInput.value = ''; // Clear the input field
        socket.emit('placeBid', { name: userName, amount: bidAmount });
    }
});

// Update the current bid and bidder information
socket.on('bidPlaced', (data) => {
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    blockTimerButton.textContent = 'Block Timer and Bid';
    blockTimerButton.classList.remove('red');
    blockTimerButton.classList.add('green');
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
});

// Update the timer display
socket.on('timerUpdate', (timeLeft) => {
    timerEl.textContent = timeLeft;

    timerEl.classList.remove('size1', 'size2', 'size3', 'size4');
    if (timeLeft > 7) {
        timerEl.classList.add('size1');
    } else if (timeLeft > 4) {
        timerEl.classList.add('size2');
    } else if (timeLeft > 1) {
        timerEl.classList.add('size3');
    } else {
        timerEl.classList.add('size4');
    }
});

// Notify when the auction ends
socket.on('auctionEnd', (data) => {
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    nominationSection.style.display = 'block';
    document.getElementById('current-auction').style.display = 'none';
    blockTimerButton.textContent = 'Block Timer and Bid';
    blockTimerButton.classList.remove('red');
});

