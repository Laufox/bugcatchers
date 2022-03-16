// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');

// Username to identify client
let username = null;
let room = null;

// When another client connects
socket.on('user:connected', (username) => {
	console.log(`${username} has connected`);
});

// Event listener for when a user submits the name form
nameFormEl.addEventListener('submit', (e) => {
	e.preventDefault();

	// Take username from the form submitted
	username = nameFormEl.username.value;
	
	// Inform the socket that client wants to join the game
	socket.emit('user:joined', username, (status) => {
		if (status.success) {
			console.log('Welcome ', username);
			startScreenEl.classList.add('hide');
			waitingScreenEl.classList.remove('hide');
		}
	})
	
});