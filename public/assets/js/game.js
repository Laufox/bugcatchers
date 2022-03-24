// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');
const endScreenEl = document.querySelector('#endResults');
const winnerEl = document.querySelector('#winnersName');
const userResultEl = document.querySelector('#result');
const positionEl = document.querySelectorAll('.position');
const userScoreEl = document.querySelector('#user');
const opponentScoreEl = document.querySelector('#opponent');
const gameScreenEl = document.querySelector('#game-screen');
const playerTimeEl = document.querySelector('#userTime h5');
const opponentTimeEl = document.querySelector('#opponentTime h5');
const roundCountdownEl = document.querySelector('#round-countdown');
const roundCountdownInfoEl = document.querySelector('#round-countdown p');
const roundCountdownSpanEl = document.querySelector('#round-countdown span');
const playingFieldEl = document.querySelector('#playing-field');
const usernameErrorEl = document.querySelector('#username-error');

// Variables to to identify names of client and opponent
let username = null;
let opponent = null;

// Score
let userScore = 0;
let opponentScore = 0;

// Variable for time passed before user clicks
let timePassed = null;

// Variable for the timer that will update and render timer to user
let timer = null;
let opponentTimer = null;

// Variable for amount of milliseconds since 1 Jan 1970 at the point when the timer starts 
let timeBeforeRound = null;

// Div where virus will display each round
let randomizePositionEl = null;
let roundCountdownInterval = null;

// Variable to count down before a round starts
let countdown = 3;

// Funtion to stop timer and calculate player click time
const stopTimer = () => {
	// Stop the interval timer that prints time to user
	clearInterval(timer);

	// Calculate how long time it took for the player to click
	timePassed = Date.now() - timeBeforeRound;

	// Show user the final time
	playerTimeEl.innerText = `${Math.floor(timePassed/1000)} : ${timePassed%1000}`;

	// Remove the click event from secretSquare
	randomizePositionEl.removeEventListener('click', stopTimer);

	// Remove virus from element
	randomizePositionEl.classList.remove('virus');

	// Give time to server
	socket.emit('game:round-result', timePassed);
};

const startTimer = (virusPosition) => {
	
	// Reset user click time
	timePassed = 0;
	// Get the amount of milliseconds since 1 Jan 1970
	timeBeforeRound = Date.now();
	// Update user with timer repeatedly 
	timer = setInterval( () => {
		timePassed = Date.now() - timeBeforeRound;
		playerTimeEl.innerText = `${Math.floor(timePassed/1000)} : ${timePassed%1000}`;
	}, 10 );

	// Display estimated time for opponent during round
	opponentTimer = setInterval( () => {
		let opponentTime = Date.now() - timeBeforeRound;
		opponentTimeEl.innerText = `${Math.floor(opponentTime/1000)} : ${opponentTime%1000}`;
	}, 10 );

	// Use virusPosition from server to pick wich div the virus gonna be at
	randomizePositionEl = positionEl[virusPosition];
	randomizePositionEl.classList.add('virus');

	// Add eventlistener for secret square that the user has to click
	randomizePositionEl.addEventListener('click', stopTimer);
	
};

// Function to display countdown to user before starting a new round
const countdownBeforeRound = (timeToWait, virusPosition) => {
	// Decrease countdown by one
	countdown--;
	// Show new countdown number to user
	roundCountdownSpanEl.innerText = countdown;

	// If countdown reach zero, stop countdown and start round
	if (countdown === 0) {

		// Stop countdown interval timer
		clearInterval(roundCountdownInterval);

		// Hide countdown display
		roundCountdownEl.classList.add('hide');

		// Show virus field
		positionEl.forEach(position => {
			position.classList.remove('hide');
		});

		// Reset countdown variable for future rounds
		countdown = 3;
		roundCountdownSpanEl.innerText = countdown;

		// Wait before showing user which square to click
		setTimeout(startTimer, timeToWait, virusPosition);
	
	}
};

// Function to start up a new round
const gameRound = (timeToWait, virusPosition) => {

	// Make sure no div have virus class attached and hide them while countdown scrren is on display
	positionEl.forEach(position => {
		position.classList.remove('virus');
		position.classList.add('hide');
	});

	// Start countdown before next round starts
	roundCountdownEl.classList.remove('hide');
	roundCountdownInterval = setInterval(countdownBeforeRound, 1000, timeToWait, virusPosition);

};

// Function to update game screen with previous round result
socket.on('game:print-round', (winner, players) => {
	// Get the opponent player
	const opponent = Object.values(players).find( player => player.username !== username);

	// Stop timer for opponent
	clearInterval(opponentTimer);

	// Set final time for opponent
	opponentTimeEl.innerText = `${Math.floor(opponent.previousReactionTime/1000)} : ${opponent.previousReactionTime%1000}`;
	
	// Increase score for the player that won
	if (winner === username) {
		userScoreEl.innerText = `${username} score: ${++userScore}`;
		// Inform user if they won the round or not
		roundCountdownInfoEl.innerText = 'You won the round!';
		roundCountdownInfoEl.classList.add('won-round');
		roundCountdownInfoEl.classList.remove('lost-round');
	} else {
		opponentScoreEl.innerText = `${opponent.username} score: ${++opponentScore}`;
		// Inform user if they won the round or not
		roundCountdownInfoEl.innerText = 'You lost the round!';
		roundCountdownInfoEl.classList.add('lost-round');
		roundCountdownInfoEl.classList.remove('won-round');
	}
});

// If the other player disconnected
socket.on('game:walkover', () => {
	// Switch active screen
	waitingScreenEl.classList.add('hide');
	gameScreenEl.classList.add('hide');
	endScreenEl.classList.remove('hide');

	// Inform user they won due to another player leaving the room
	winnerEl.innerHTML = `You win!`
	userResultEl.innerHTML = `Opponent disconnected`
});

// When a game/round is ready to start
socket.on('game:start', (timeToWait, virusPosition) => {

	// Hide waiting screen and display game screen
	waitingScreenEl.classList.add('hide');
	gameScreenEl.classList.remove('hide');

	// Update the score
	userScoreEl.innerText = `${username} score: ${userScore}`;
	opponentScoreEl.innerText = `${opponent} score: ${opponentScore}`;

	// Start a new round with time and position given by server
	gameRound(timeToWait, virusPosition);
});

// To know the names of both players
socket.on('print:names', (players) => {

	// Set users own name
	username = nameFormEl.username.value;

	// Turn players object to array
	const playerList = Object.values(players);
	const playerNames = [];

	// Sort out both players name
	playerList.forEach( (player) => {
		playerNames.push(player.username);
	} );

	// Remove own name from array and set it's value as name of opponent
	const player1 = playerNames.indexOf(username);
	playerNames.splice(player1, 1);
	opponent = playerNames;

});

// Function for when game is finished
socket.on('game:over', (playerOne, playerTwo) => {

	// Hide other sections and show end-screen section
	waitingScreenEl.classList.add('hide');
	gameScreenEl.classList.add('hide');
	endScreenEl.classList.remove('hide');

	// Find out which of the players from params that this client represent
	const self = playerOne.username === username ? playerOne : playerTwo;
	// Find out which of the players from params that other client represent
	const opponent = playerOne.username === username ? playerTwo : playerOne;
	
	// Compare client and opponent score to find out who won
	if(self.points > opponent.points) {
		userResultEl.innerHTML = `You won! Score: ${self.points} - ${opponent.points}`;
		userResultEl.classList.add('winResult');
	} else if (opponent.points > self.points) {
		userResultEl.innerHTML = `You lost! Score: ${self.points} - ${opponent.points}`;
		userResultEl.classList.add('loseResult');
	} else if(self.points === opponent.points) {
		userResultEl.innerHTML = `It's a tie! Score: ${self.points} - ${opponent.points}`;
	}
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

			// Hide start-screen element
			startScreenEl.classList.add('hide');

			// Show waiting-screen element
			waitingScreenEl.classList.remove('hide');

			// If the startGame property from callback is true, start new game 
			if (status.startGame) {
				waitingScreenEl.classList.add('hide');
				gameScreenEl.classList.remove('hide');
				// Initialize score-table for player and opponent
				userScoreEl.innerText = `${username} score: ${userScore}`;
				opponentScoreEl.innerText = `${opponent} score: ${opponentScore}`;
				gameRound(status.timeToWait, status.virusPosition);
			}
			
		} else if (!status.success) {
			// If status.succes did not come back true, inform user with error message
			usernameErrorEl.classList.remove('hide');
			usernameErrorEl.innerText = status.msg;
		}
	})

});

// Change cursor image while mouse-button is being held down
playingFieldEl.addEventListener('mousedown', () => {
	playingFieldEl.classList.add('aim');
});

playingFieldEl.addEventListener('mouseup', () => {
	playingFieldEl.classList.remove('aim');
});