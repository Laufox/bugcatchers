// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');
const positionEl = document.querySelectorAll('.position');
const virusEl = document.querySelector('.virus');	// might not need this
const timestampEl = document.querySelector('#time-stamp');
const userScoreEl = document.querySelector('#user');
const opponentScoreEl = document.querySelector('#opponent');
// const scoreEl = document.querySelector('#scores');
const gameScreenEl = document.querySelector('#game-screen');
const playerTimeEl = document.querySelector('#userTime h5');

// Username to identify client
let username = null;
let room = null;

// Score
let score = 0;

// Rounds
let rounds = 0;

// The target to kill virus
let target;

// Randomizer
let randomizer = Math.floor(Math.random() * (3 - 1 + 1) + 1);

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
	console.log("Starting timer " + timeToWait);

	// Wait before showing user wich square to click
	setTimeout(startTimer, timeToWait);
}


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

// Function to random position the viruses
const randomPosition = () => {
	positionEl.forEach(position => {
		position.classList.remove('virus');
	});

	// randomize the position for the viruses
	let randomizePosition = positionEl[Math.floor(Math.random() * 9)]
	randomizePosition.classList.add('virus');

	console.log(randomizePosition)

	// target the virus
	target = randomizePosition.id

	rounds++;
};

// Random timer for the virus
const virusTimer = () => {
	// let randomizer = Math.floor(Math.random() * (3 - 1 + 1) + 1);

	let timer;
	timer = setInterval(randomPosition, randomizer * 835);
};
virusTimer();


// Destroy the virus function
positionEl.forEach(position => {
	position.addEventListener('click', () => {
		if (position.id === target) {
			// +1 on score
			score++

			// add to score needs to be fixed
			userScoreEl.innerHTML = `Player Score: ${score}`
			console.log(score);

			// reset the target
			target = null

			// remove the virus from the current spot
			position.classList.remove('virus');
		}
	})
});