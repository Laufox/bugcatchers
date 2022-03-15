// Socket variable
const socket = io();

// Document elements to use/manipulate
const startScreenEl = document.querySelector('#start-screen');
const nameFormEl = document.querySelector('#name-form');
const waitingScreenEl = document.querySelector('#waiting-screen');

// Username to identify client
let username = null;
let room = null;

// Event listener for when a user submits the name form
nameFormEl.addEventListener('submit', (e) => {
	e.preventDefault();

	username = nameFormEl.username.value;
	console.log(username);

	startScreenEl.classList.add('hide');
	waitingScreenEl.classList.remove('hide');
});