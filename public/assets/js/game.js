// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');
const gameScreenEl = document.querySelector('#game-screen');

// Username to identify client
let username = null;
let room = null;

// When another client connects
socket.on('user:connected', (username) => {
	
	//console.log(`${username} has connected`);
	// When a game is ready to start
	socket.on('game:start', () => {
	console.log('Opponent found, game will begin');
	})
});

// Event listener for when a user submits the name form
nameFormEl.addEventListener('submit', (e) => {
	e.preventDefault();

	// Take username from the form submitted
	username = nameFormEl.username.value;
	
	// Inform the socket that client wants to join the game
	socket.emit('user:joined', username, (status) => {
		// If the server returns a successful callback
		if (status.success) {
			console.log('Welcome ', username);
			// Hide start-screen element
			startScreenEl.classList.add('hide');
			// Show waiting-screen element
			waitingScreenEl.classList.remove('hide');
			// If the startGame property from callback is true, start new game 
			if (status.startGame) {
				console.log("Game will begin");
				waitingScreenEl.classList.add('hide');
				gameScreenEl.classList.remove('hide');
			}
		}
	})
	
});