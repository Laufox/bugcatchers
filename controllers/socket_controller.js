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

// Set time to wait to a random number between 0 and 5000
const calcTimeAndPosition = () => {	
	timeToWait = Math.round(Math.random()*5000);
	virusPosition = Math.floor(Math.random() * 9);
} 

// When a user joins a room
const handleUserJoined = function(username, callback) {

	// Varuable to know if the game should start or not
	let startGame = false;

	// If waiting queue is empty, create a new room
	if (waitingQueue === 0) {
		rooms.push({
			// Set room id to numberOfRooms variable, then increase the numberOfRooms variable
			room_id: numberOfRooms++,
			// numberOfPlayers: 0, 			-- Might be needed later
			// Object property to hold info about the users that is in the room
			players: {},
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
	currentRoom.players[this.id] = {
		username,
		points: 0,
	 	previousReactionTime: null,
	};
	
	debug('List of rooms: ', rooms);
	debug('Current room: ', currentRoom);

	// Increase the waiting queue
	waitingQueue++;

	// If there is two clients in queue, prepare to start the game
	if (waitingQueue === 2) {
		debug('Client ready to start new game');
		// Reset waiting queue variable
		waitingQueue = 0;
		// Set startGame variable to true
		startGame = true;
		// Call function to set set timer
		calcTimeAndPosition();
		// Tell the other clients in the room that a new game should start
		this.broadcast.to(currentRoom).emit('game:start', timeToWait, virusPosition);
	}

	// Let everyone know a client has connected
	// this.broadcast.emit('user:connected', username);

	// Callback to client
	callback({
		success: true,
		room: currentRoom.room_id,
		startGame,
		timeToWait,
		virusPosition,
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
	console.log("This player id", room.players[this.id].username);
	delete room.players[this.id];

	if (waitingQueue > 0) {
		waitingQueue--;
	}
	
}

// Compare reaction time and decide who gets score
// Take room parameter instead of score
const handleScore = function(reaction, player) {
	// Find the room this socket is connected to
	const room = rooms.find(lobby => lobby.players.hasOwnProperty(this.id));

	room.players[this.id].previousReactionTime = reaction;

	let foundNull = false;

	Object.values(room.players).forEach( (player) => {
		if (player.previousReactionTime === null) {
			foundNull = true;
		}
	} )

	if (!foundNull) {
		console.log("Null found");
		const p1RecTime = Object.values(room.players)[0].previousReactionTime;
		const p2recTime = Object.values(room.players)[1].previousReactionTime;
		const winningPlayer = p1RecTime < p2recTime ? Object.values(room.players)[0].username : Object.values(room.players)[1].username;
		calcTimeAndPosition();
		io.in(room).emit('game:print-round', winningPlayer, room.players);
	};
	// Find two players in the room

	// Compare reaction time for the two players
	// Only compare and emit if two reactiontimes is in room

	const winningPlayer = room.players[this.id]
	debug(`Client ${winningPlayer} won this round`);

	// Emit with arguments winner true/false or name of winner and both reaction times
	io.in(room).emit('game:round-result',)
	// If 10 rounds played, emit to game:end
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
