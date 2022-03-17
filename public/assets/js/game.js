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

// Variable for time passed before user clicks
let timePassed = null;
// Variable for the timer that will update and render timer to user
let timer = null;
// Variable for amount of milliseconds since 1 Jan 1970 at the point when the timer starts 
let timeBeforeRound = null;

// Funtion to stop timer and calculate player click time
const stopTimer = () => {
	// Stop the interval timer that prints time to user
	clearInterval(timer);
	// Calculate how long time it took for the player to click
	timePassed = Date.now() - timeBeforeRound;
	console.log('It took you ' + timePassed + ' milliseconds to click');
	// Show user the final time
	playerTimeEl.innerText = `${Math.floor(timePassed/1000)} : ${timePassed%1000}`;
	// Remove the click event from secretSquare
	// --- Change from game screen to the specific square --
	gameScreenEl.removeEventListener('click', stopTimer);
	// Give time to server
	socket.emit('game:round-result', timePassed, username);
}

const startTimer = () => {
	console.log("Wait time over, lets start!");

	// Reset user click time
	timePassed = 0;
	// Get the amount of milliseconds since 1 Jan 1970
	timeBeforeRound = Date.now();
	console.log(timeBeforeRound);
	// Update user with timer repeatedly 
	timer = setInterval( () => {
		timePassed = Date.now() - timeBeforeRound;
		playerTimeEl.innerText = `${Math.floor(timePassed/1000)} : ${timePassed%1000}`;
	}, 10 );

	// --- Display the square to click ---

	// Add eventlistener for secret square that the user has to click
	// --- Change from game screen to the specific square --
	gameScreenEl.addEventListener('click', stopTimer);
}

// Function to start up a new round
const gameRound = (timeToWait) => {
	// Hide waiting screen and display game screen
	waitingScreenEl.classList.add('hide');
	gameScreenEl.classList.remove('hide');
	console.log("Starting timer " + timeToWait);

	// Wait before showing user wich square to click
	setTimeout(startTimer, timeToWait);
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