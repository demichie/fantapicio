const socket = io();

// Elements to update
const participantsList = document.getElementById('participants-list');
const currentOfferEl = document.getElementById('current-offer');
const currentBidderEl = document.getElementById('current-bidder');
const bidButton = document.getElementById('bid-button');

// Update the participants section
socket.on('participantsUpdate', (participants) => {
  participantsList.innerHTML = ''; // Clear existing list
  participants.forEach((participant) => {
    const li = document.createElement('li');
    li.textContent = `${participant.name} - Budget: ${participant.budget}, Players Bought: ${participant.playersBought}`;
    participantsList.appendChild(li);
  });
});

// Update the current offer on the screen
socket.on('newOffer', (offer) => {
  currentOfferEl.textContent = offer.amount;
  currentBidderEl.textContent = offer.participant;
});

// Handle auction end event
socket.on('auctionEnd', (winner) => {
  alert(`${winner.participant} wins the auction with an offer of ${winner.amount}!`);
});

// Sample function to place a bid (for demo purposes, this would be more interactive)
bidButton.addEventListener('click', () => {
  const bidAmount = prompt('Enter your bid amount:');
  const participantName = prompt('Enter your name:');

  socket.emit('newBid', { participant: participantName, amount: parseInt(bidAmount) });
});

