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
			// Object property to hold info about the users that is in the room
			players: {}
		});
	}

	// Use the latest room pushed to the rooms array so that we can add info to it 
	currentRoom = rooms[rooms.length - 1];

	// Have the socket client to join the current room
	this.join(currentRoom);
	// Add clients username as property in the current room
	currentRoom.players[this.id] = username;
	
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
	console.log("This player id", room.players[this.id]);
	delete room.players[this.id];

	if (waitingQueue > 0) {
		waitingQueue--;
	}
	
}	

// Export function
module.exports = function(socket, _io) {
	io = _io;
	debug('a new client has connected', socket.id);

	// handle user disconnect
	socket.on('disconnect', handleDisconnect);

	// handle user joined
	socket.on('user:joined', handleUserJoined);

}
