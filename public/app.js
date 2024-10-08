const socket = io();
let userName = null;
let participants = []; // To store participants on the client-side
let currentBidder = [];
let currentBid = [];

const nameInputSection = document.getElementById('name-input-section');
const auctionSection = document.getElementById('auction-section');
const participantsTableBody = document.querySelector('#participants-table tbody');
// const participantsList = document.getElementById('participants-list');
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

// Audio element
const timerAudio = document.getElementById('timer-audio');

// Event listener for joining the auction
document.getElementById('join-button').addEventListener('click', () => {
    const nameInput = document.getElementById('name-input').value;
    const budgetInput = document.getElementById('budget-input').value;
    const playersInput = document.getElementById('players-input').value;

    if (nameInput && budgetInput && playersInput) {
        userName = nameInput;
        initialBudget = parseInt(budgetInput);
        remainingPlayers = parseInt(playersInput);
        socket.emit('registerParticipant', { name: userName, budget: initialBudget, remainingPlayers: remainingPlayers });
        nameInputSection.style.display = 'none';
    }
});

// Update the participant table
socket.on('participantsUpdate', (updatedParticipants) => {
    participants = updatedParticipants;
    updateParticipantsDisplay();
});

// Function to update participants table display on the page
function updateParticipantsDisplay() {
    participantsTableBody.innerHTML = ''; // Clear the table body

    participants.forEach((participant) => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = participant.name;

        const budgetCell = document.createElement('td');
        budgetCell.textContent = participant.budget;

        const remainingPlayersCell = document.createElement('td');
        remainingPlayersCell.textContent = participant.remainingPlayers;

        row.appendChild(nameCell);
        row.appendChild(budgetCell);
        row.appendChild(remainingPlayersCell);

        participantsTableBody.appendChild(row);
    });
}

// Listen for participants data from the server
socket.on('participantsData', (data) => {
    participants = data; // Update the participants list on the client-side
});

// Notify when the game is ready
socket.on('gameReady', () => {
    auctionSection.style.display = 'block';
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
    currentBidder = data.bidder;
    currentBid = 1;
    nominationSection.style.display = 'none';
    document.getElementById('current-auction').style.display = 'block';
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
    document.getElementById('bidder-section').style.display = 'none';
    // Start playing the timer audio when the auction begins
    timerAudio.play();    
});

// Block the timer when the button is clicked
blockTimerButton.addEventListener('click', () => {
    socket.emit('getParticipants');
    const bidder = participants.find(p => p.name === userName);
    if ( bidder.budget >= bidder.remainingPlayers && userName != currentBidder && bidder.budget > currentBid ) {
        document.getElementById('bid-section').style.display = 'block';
        socket.emit('blockTimer', userName);
        document.getElementById('bidder-section').style.display = 'none';
    }
});

// Update the button text and timer
socket.on('blockTimer', (bidderName) => {
    document.getElementById('block-section').style.display = 'none';
    document.getElementById('bidder-section').style.display = 'block';
    // bidder-button.textContent = `ciccio is bidding`;
    document.getElementById('bidder-button').innerText = bidderName + ' is bidding';
    timerEl.textContent = 10;
    timerEl.classList.add('size1');
    // Stop the timer audio when the timer is blocked
    timerAudio.pause();
    timerAudio.currentTime = 0; // Reset audio playback position
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

socket.on('bidError', (message) => {
    alert(message); // Display bid error message
    bidSection.style.display = 'block';    
});

// Update the current bid and bidder information
socket.on('bidPlaced', (data) => {
    currentBidEl.textContent = data.amount;
    currentBidderEl.textContent = data.bidder;
    blockTimerButton.textContent = 'Block Timer and Bid';
    blockTimerButton.classList.add('green');
    document.getElementById('block-section').style.display = 'block';
    document.getElementById('bid-section').style.display = 'none';
    document.getElementById('bidder-section').style.display = 'none';
    timerAudio.currentTime = 0; // Reset audio playback position
    timerAudio.play();    
    currentBidder = data.bidder;
    currentBid = data.amount;
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
    timerEl.textContent = 0;
    alert(`${data.winner} wins the auction for ${data.player} with a bid of ${data.bid}!`);
    nominationSection.style.display = 'block';
    document.getElementById('current-auction').style.display = 'none';
    document.getElementById('block-section').style.display = 'none';
    document.getElementById('bid-section').style.display = 'none';
    blockTimerButton.textContent = 'Block Timer and Bid';
    // Stop the timer audio when the auction ends
    timerAudio.pause();
    timerAudio.currentTime = 0;    
});

