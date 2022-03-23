/**
 * Socket Controller
 */

// Import debug module
const debug = require('debug')('ktv:socket_controller');

let io = null;

// Rooms for games and their users
const rooms = [];
// Number of rooms that exists
let numberOfRooms = 0;
// Number of people currently in queue
let waitingQueue = 0;
// Time to wait before virus pop ups
let timeToWait = 0;
let virusPosition = null;
let currentRoom;
let autoWin;

// Set time to wait to a random number between 0 and 5000
const calcTimeAndPosition = () => {	
	timeToWait = Math.round(Math.random()*5000);
	virusPosition = Math.floor(Math.random() * 9);
} 

// When a user joins a room
const handleUserJoined = function(username, callback) {

	// Varuable to know if the game should start or not
	let startGame = false;
	debug('WQ at start: ', waitingQueue);
	// If waiting queue is empty, create a new room
	if (waitingQueue === 0) {
		rooms.push({
			// Set room id to numberOfRooms variable, then increase the numberOfRooms variable
			room_id: numberOfRooms++,
			// numberOfPlayers: 0, 			-- Might be needed later
			gameStatus: 'waiting',
			// Object property to hold info about the users that is in the room
			players: {},
			// Number of rounds played in this room
			roundsplayed: 0,
		});
	}

	// Use the latest room pushed to the rooms array so that we can add info to it 
	const currentRoom = rooms[rooms.length - 1];
	// currentRoom.numberOfPlayers++;	-- Might be needed later

	// Have the socket client to join the current room
	this.join(currentRoom);
	// Add clients username as property in the current room
	// currentRoom.players[this.id] = username;
	// Each player object in a room holds info aboiut their name, current score and their previous reaction time
	currentRoom.players[this.id] = {
		username,
		points: 0,
	 	previousReactionTime: null,
	};
	
	debug('List of rooms: ', rooms);
	debug('Current room: ', currentRoom);

	// Increase the waiting queue
	waitingQueue++;
	debug('WQ after increase: ', waitingQueue);
	// If there is two clients in queue, prepare to start the game
	if (waitingQueue === 2) {
		debug('Client ready to start new game');
		debug(currentRoom.players);
		// Reset waiting queue variable
		waitingQueue = 0;
		// Set current room as active
		currentRoom.gameStatus = 'ongoing',
		// Set startGame variable to true
		startGame = true;
		// Call function to set set timer
		calcTimeAndPosition();
		// Tell the other clients in the room that a new game should start
		this.broadcast.to(currentRoom).emit('game:start', timeToWait, virusPosition, currentRoom.players);
	}

	// Let everyone know a client has connected
	// this.broadcast.emit('user:connected', username);

	// Callback to client
	callback({
		success: true,
		room: currentRoom.room_id,
		players: currentRoom.players,
		startGame,
		timeToWait,
		virusPosition,
		autoWin
	});
}

// When a client disconnects
const handleDisconnect = function() {
	debug(`Client ${this.id} disconnected :(`);

	// Find the room this socket is connected to
	const room = rooms.find(lobby => lobby.players.hasOwnProperty(this.id));

	//If socket is not in a room, do nothing and return
	if(!room) {
		return;
	}
	// Delete the player from the room
	console.log("Player id:", room.players[this.id].username);
	delete room.players[this.id];

	console.log("Other player automatically wins", room.players);
	autoWin = room.players.username;

	debug('WQ on DC: ', waitingQueue);
	if (room.gameStatus === 'waiting') {
		waitingQueue--;
	}
	
}

// Compare reaction time and decide who gets score
// Take room parameter instead of score
const handleScore = function(reaction, player) {
	// Find the room this socket is connected to
	const room = rooms.find(lobby => lobby.players.hasOwnProperty(this.id));

	// Get the players reaction time from parameter
	room.players[this.id].previousReactionTime = reaction;

	// Variable to know if both player in room are done
	let foundNull = false;

	// Check if other player finished
	Object.values(room.players).forEach( (player) => {
		if (player.previousReactionTime === null) {
			foundNull = true;
		}
	} )

	// If both players are done
	if (!foundNull) {
			// Single out each player
			const playerOne = Object.values(room.players)[0];
			const playerTwo = Object.values(room.players)[1];

			// Get winning name from comparing both reaction times
			const winningPlayer = playerOne.previousReactionTime < playerTwo.previousReactionTime ? playerOne.username : playerTwo.username;

			// Send result to all players in room
			io.in(room).emit('game:print-round', winningPlayer, room.players);

			// Set both players previous reaction time to null for future rounds
			playerOne.previousReactionTime = null;
			playerTwo.previousReactionTime = null;

			// Increase number of rounds played in game room
			room.roundsplayed++;

			// If Rounds played is less than 10, start a new round. Otherwise finish game
			if(room.roundsplayed < 10) {
				// Calculate a new random tim ena position
				calcTimeAndPosition();
				// Start new round
				io.in(room).emit('game:start', timeToWait, virusPosition, room.players);
			} else {
				// --- Send final result to clients ---
				console.log(' Game finished ');
				io.emit('receive-results', playerOne, playerTwo)
			}
		}	
	// Find two players in the room

	// Compare reaction time for the two players

	//const winningPlayer = room.players[this.id]
	//debug(`Client ${winningPlayer} won this round`);

}


// Export function
module.exports = function(socket, _io) {
	io = _io;
	debug('a new client has connected', socket.id);

	// handle user disconnect
	socket.on('disconnect', handleDisconnect);

	// handle user joined
	socket.on('user:joined', handleUserJoined);

	// handle user score
	socket.on('game:round-result', handleScore);
}
