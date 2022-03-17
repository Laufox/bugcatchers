// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');
const gameScreenEl = document.querySelector('#game-screen');
const playerTimeEl = document.querySelector('#userTime h5');

// Username to identify client
let username = null;
let room = null;

let timePassed = null;
let timer = null;
let timeBeforeRound = null;
let timeAfterRound = null;

const startTimer = () => {
	timePassed = 0;
	timer = setInterval( () => {
		timePassed++;
	}, 1 );
}

const stopTimer = () => {

}

const secretSquareClick = () => {
	console.log("Wait time over, lets start!");

	// set interval timer
	timePassed = 0;
	timeBeforeRound = Date.now();
	console.log(timeBeforeRound);
	timer = setInterval( () => {
		timePassed+100;
		playerTimeEl.innerText = `${Math.floor(timePassed/1000)} : ${timePassed%1000}`;
		// Update html element
	}, 100 );

	// Add eventlistener for secret square
	gameScreenEl.addEventListener('click', () => {
		clearInterval(timer);
		timeAfterRound = Date.now();
		timePassed = timeAfterRound - timeBeforeRound;
		console.log('It took you ' + timePassed + ' milliseconds to click');
	});
}

const gameRound = (timeToWait) => {
	waitingScreenEl.classList.add('hide');
	gameScreenEl.classList.remove('hide');
	console.log("Starting timer " + timeToWait);

	setTimeout(secretSquareClick, timeToWait);
}

// When another client connects
socket.on('user:connected', (username) => {
	//console.log(`${username} has connected`);
});

// When a game is ready to start
socket.on('game:start', (timeToWait) => {
	console.log('Opponent found, game will begin');
	gameRound(timeToWait);
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
				gameRound(status.timeToWait);
			}
		}
	})
	
});