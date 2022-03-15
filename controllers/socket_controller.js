/**
 * Socket Controller
 */

// Import debug module
const debug = require('debug')('chat:socket_controller');

let io = null;

const rooms = null;

// When a client disconnects
const handleDisconnect = function() {
	debug(`Client ${this.id} disconnected :(`);
}

// When a user joins a room
const handleUserJoined = function(callback) {
	
	callback({
		success: true,
	});
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
