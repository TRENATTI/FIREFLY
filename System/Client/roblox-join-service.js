require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");
const axios = require("axios")

function RJS(client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix) {
		//var blacklist = [1, 261]
		console.log(
			new Date(), "| roblox-join-service.js |", "Ready!")
		var evt = noblox.onJoinRequestHandle(32498529)
		evt.on('data', function (request) {
			console.log(Date.now(), "| roblox-join-service.js |", "Request made...")
			axios
				.get(
					`https://badges.roblox.com/v1/users/${request.requester.userId}/badges?limit=100`
				)
				.then(function (response) {
					console.log(response.data);
					if (response.data.data.length != 0) {
						if (response.data.nextPageCursor == null) {
							evt.emit('handle', request, false);
							console.log(
								new Date(), "| roblox-join-service.js |", "Denied!", request.requester.userId)
							return;
						}
					}
					evt.emit('handle', request, true, function () {
						console.log(
							new Date(), "| roblox-join-service.js |", "Accepted!", request.requester.userId)
					});
				})
				})

}

module.exports = RJS;
