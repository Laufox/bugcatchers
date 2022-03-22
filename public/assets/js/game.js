// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');
const endScreenEl = document.querySelector('#endResults');
const userResults = document.querySelector('#endResults h2');
const playerName = document.querySelector('#user')
const opponentName = document.querySelector('#opponent')
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
let oTimer = null;

// Variable for amount of milliseconds since 1 Jan 1970 at the point when the timer starts 
let timeBeforeRound = null;

// Div where virus will display each round
let randomizePositionEl = null;

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
	randomizePositionEl.removeEventListener('click', stopTimer);
	// Give time to server
	socket.emit('game:round-result', timePassed, username);

	// Exempel på hur det skulle kunna vara, player1Score är då spelaren med id 0, player2Score är spelare med id 1. Den tar bara in information från socket_controller och jämför resultatet här och matar ut det i endScreen.

	// Använd i egen funktion när spelet är slut
	/*
	if(rounds === 10) {
		waitingScreenEl.classList.add('hide');
		gameScreenEl.classList.add('hide');
		endScreenEl.classList.remove('hide');

		if(player1Score > player2Score) {
			userResults.innerHTML = `Result:${score}`// socket_controller ska skicka resultat hit
			userResults.classList.add('winResult');

		} else if (player1Score > player2Score) {
			userResults.innerHTML = `Result: ${score}`// socket_controller ska skicka resultat hit
			userResults.classList.add('loseResult');

		} else if(player1Score == player2Score) {
			userResults.innerHTML = `It's a tie! Result:${score}`// socket_controller ska skicka resultat hit
		}
	}
	*/
}


const startTimer = (virusPosition) => {
	console.log("Wait time over, lets start!");
	console.log("Round", rounds)

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

	oTimer = setInterval( () => {
		let oTime = Date.now() - timeBeforeRound;
		document.querySelector('#opponentTime h5').innerText = `${Math.floor(oTime/1000)} : ${oTime%1000}`;
	}, 10 );

	// User virusPosition from server to pick wich div the virus gonna be at
	randomizePositionEl = positionEl[virusPosition];
	randomizePositionEl.classList.add('virus');

	target = randomizePositionEl.id;

	// Add eventlistener for secret square that the user has to click
	// --- Change from game screen to the specific square --
	randomizePositionEl.addEventListener('click', stopTimer);
	rounds++;
	console.log("Rounds played:",rounds)
	
}

// Function to start up a new round
const gameRound = (timeToWait, virusPosition) => {
	console.log("Starting timer " + timeToWait + " for virus on position " + virusPosition);

	// Make sure no div have virus class attached
	positionEl.forEach(position => {
		position.classList.remove('virus');
	});

	// Wait before showing user which square to click
	setTimeout(startTimer, timeToWait, virusPosition);
	
}

socket.on('game:print-round', (winner, players) => {
	// Get the opponent player
	const opponent = Object.values(players).find( player => player.username !== username);
	console.log(opponent);
	// Stop timer for opponent
	clearInterval(oTimer);
	// Set final time for opponent
	document.querySelector('#opponentTime h5').innerText = `${Math.floor(opponent.previousReactionTime/1000)} : ${opponent.previousReactionTime%1000}`;
	// --- Print round result based on if won or not ---
	if (winner === username) {
		console.log('I won');
	} else {
		console.log('I lost');
	}
});

// When another client connects
socket.on('user:connected', (username) => {
	//console.log(`${username} has connected`);
	// When a game is ready to start
	
});

// When a game/round is ready to start
socket.on('game:start', (timeToWait, virusPosition) => {
	console.log('Opponent found, game will begin');
	// Hide waiting screen and display game screen
	waitingScreenEl.classList.add('hide');
	gameScreenEl.classList.remove('hide');
	// Start a new round with time and position given by server
	gameRound(timeToWait, virusPosition);
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
			// Set room client is part of to room id given back by server
			room = status.room;
			// If the startGame property from callback is true, start new game 
			if (status.startGame) {
				console.log("Game will begin");
				waitingScreenEl.classList.add('hide');
				gameScreenEl.classList.remove('hide');
				gameRound(status.timeToWait, status.virusPosition);
			}
		}
	})
});

// Function to random position the viruses
// const randomPosition = () => {
// 	positionEl.forEach(position => {
// 		position.classList.remove('virus');
// 	});

// 	// randomize the position for the viruses
// 	let randomizePosition = positionEl[Math.floor(Math.random() * 9)]
// 	randomizePosition.classList.add('virus');

// 	console.log(randomizePosition)

// 	// target the virus
// 	target = randomizePosition.id

// 	rounds++;
// };

// // Random timer for the virus
// const virusTimer = () => {
// 	// let randomizer = Math.floor(Math.random() * (3 - 1 + 1) + 1);

// 	let timer = null;
// 	timer = setInterval(randomPosition, randomizer * 835);
// };
//virusTimer();


// Destroy the virus function
positionEl.forEach(position => {
	position.addEventListener('click', () => {
		if (position.id === target) {
			// +1 on score
			score++

			// add to score needs to be fixed
			userScoreEl.innerHTML = `Player Score: ${score}`
			console.log("Player Score:",score);

			// reset the target
			target = null

			// remove the virus from the current spot
			position.classList.remove('virus');
		}
	})
});