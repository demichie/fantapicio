const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Dati dell'asta
let currentOffer = 1;
let currentBidder = null;
let currentPlayer = null;
let timer;
let playersLeft = {}; // Numero di giocatori rimasti per ogni partecipante
let budgets = {};     // Budget di ogni partecipante

// Imposta iniziale: 25 giocatori e 500 crediti per partecipante
const INITIAL_BUDGET = 500;
const INITIAL_PLAYERS = 25;

const startTimer = () => {
  let countdown = 10;
  timer = setInterval(() => {
    countdown--;
    io.emit('timer', countdown);
    if (countdown === 0) {
      clearInterval(timer);
      io.emit('auction_winner', { winner: currentBidder, player: currentPlayer, price: currentOffer });
      // Aggiorna budget e giocatori
      if (currentBidder) {
        budgets[currentBidder] -= currentOffer;
        playersLeft[currentBidder]--;
      }
      resetAuction();
    }
  }, 1000);
};

// Resetta lo stato dell'asta dopo l'assegnazione di un giocatore
const resetAuction = () => {
  currentOffer = 1;
  currentBidder = null;
  currentPlayer = null;
  io.emit('auction_reset');
};

// Gestisce le connessioni
io.on('connection', (socket) => {
  console.log('Un partecipante si è connesso');

  // Inizializza il partecipante con nome e budget
  socket.on('register_participant', (name) => {
    budgets[name] = INITIAL_BUDGET;
    playersLeft[name] = INITIAL_PLAYERS;
    socket.emit('budget_update', { budget: budgets[name], playersLeft: playersLeft[name] });
  });

  // Inizia l'asta per un giocatore
  socket.on('new_player', (player) => {
    currentPlayer = player;
    io.emit('new_player', player);
    startTimer();
  });

  // Gestisce i rilanci
  socket.on('new_bid', (data) => {
    const { offer, bidder } = data;
    const maxBid = budgets[bidder] - playersLeft[bidder] + 1;

    if (offer > currentOffer && offer <= maxBid) {
      currentOffer = offer;
      currentBidder = bidder;
      io.emit('new_offer', { offer: currentOffer, bidder: currentBidder });
      clearInterval(timer);
      startTimer();
    } else {
      socket.emit('bid_rejected', 'Offerta non valida o superiore al tuo budget.');
    }
  });
});

server.listen(3000, () => {
  console.log('Server in ascolto sulla porta 3000');
});

