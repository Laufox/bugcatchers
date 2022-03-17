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
	const currentRoom = rooms[rooms.length - 1];

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
		// Tell the other clients in the room that a new game should start
		this.broadcast.to(currentRoom).emit('game:start');
	}

	// Let everyone know a client has connected
	// this.broadcast.emit('user:connected', username);

	// Callback to client
	callback({
		success: true,
		startGame
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

	waitingQueue--;
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
