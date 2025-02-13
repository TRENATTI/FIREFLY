require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");
const axios = require("axios")

async function RJS(client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix) {
		
		console.log(
			new Date(), "| roblox-join-service.js |", "Ready!")
		const guild = await client.guilds.fetch(`1314823843315187742`);
		const channel = await guild.channels.fetch("1339624322221998133");
		var evt = noblox.onJoinRequestHandle(32498529)
		evt.on('data', function (request) {
			console.log(Date.now(), "| roblox-join-service.js |", "Request made...")
			axios
				.get(
					`https://badges.roblox.com/v1/users/${request.requester.userId}/badges?limit=100`
				)
				.then(function (response) {
					console.log(response.data);
					if (response.data.data.length < 50) {
						evt.emit('handle', request, false);
						console.log(
							new Date(), "| roblox-join-service.js |", "Denied!", request.requester.userId)
						
						getUserThumbnail(request, false)
					} else {
						evt.emit('handle', request, true, function () {
							console.log(
								new Date(), "| roblox-join-service.js |", "Accepted!", request.requester.userId)
								getUserThumbnail(request, true)
						});
					}
				})
			})

			async function getUserThumbnail(request, status) {
				axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${request.requester.userId}&size=720x720&format=Png&isCircular=false`)
					.then(function (response){
						console.log(response.data)
						if (response.data.data.length == 0){
							sendWebhookMessage(request, status, false)
						}else{
							const thumbnail = response.data.data[0].imageUrl
							sendWebhookMessage(request, status, thumbnail)
						}
					})
					.catch(error => console.log(error));
			}

			async function sendWebhookMessage(request, status, thumbnail) {
				const vyhalla = await noblox.getGroup(32498529)
				const rank = await noblox.getRankNameInGroup(32498529, request.requester.userId)
				if (status == true) {
					if (thumbnail == false) {
						const embed = {
							"color": 65311,
							"fields": [
							{
								"name": "Acceptance",
								"value": `[${request.requester.username}](https://www.roblox.com/users/${request.requester.userId}/profile) [\`\`${request.requester.userId}\`\`] has been accepted into [Vyhalla](https://www.roblox.com/communities/32498529/Vyhalla)! \nCurrent rank: \`\`${rank}\`\`\nTotal members in Vyhalla: \`\`${vyhalla.memberCount}\`\``
							}
							],
							"footer": {
							"text": "Vyhalla Public Audit",
							"icon_url": "https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"
							},
							"timestamp": new Date(),
							"thumbnail": {
							"url": thumbnail
							}
						}
						channel.send({ embeds: [embed] });
					} else {
						const embed = {
							"color": 65311,
							"fields": [
							{
								"name": "Acceptance",
								"value": `[${request.requester.username}](https://www.roblox.com/users/${request.requester.userId}/profile) [\`\`${request.requester.userId}\`\`] has been accepted into [Vyhalla](https://www.roblox.com/communities/32498529/Vyhalla)! \nCurrent rank: \`\`${rank}\`\`\nTotal members in Vyhalla: \`\`${vyhalla.memberCount}\`\``
							}
							],
							"footer": {
							"text": "Vyhalla Public Audit",
							"icon_url": "https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"
							},
							"timestamp": new Date(),
							"thumbnail": {
							"url": thumbnail
							}
						}
						channel.send({ embeds: [embed] });
					}
				} else {
					if (thumbnail == false) {
						const embed = {
							"color": 16711680,
							"fields": [
							  {
								"name": "Rejection",
								"value": `[${request.requester.username}](https://www.roblox.com/users/${request.requester.userId}/profile) [\`\`${request.requester.userId}\`\`] has been declined into [Vyhalla](https://www.roblox.com/communities/32498529/Vyhalla)! \nCurrent rank: \`\`${rank}\`\`\nTotal members in Vyhalla: \`\`${vyhalla.memberCount}\`\``
							  }
							],
							"footer": {
							"text": "Vyhalla Public Audit",
							"icon_url": "https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"
							},
							"timestamp": new Date(),
							"thumbnail": {
							"url": "https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"
							}
						}
						channel.send({ embeds: [embed] });
					} else {
						const embed = {
							"color": 16711680,
							"fields": [
							  {
								"name": "Rejection",
								"value": `[${request.requester.username}](https://www.roblox.com/users/${request.requester.userId}/profile) [\`\`${request.requester.userId}\`\`] has been declined into [Vyhalla](https://www.roblox.com/communities/32498529/Vyhalla)! \nCurrent rank: \`\`${rank}\`\`\nTotal members in Vyhalla: \`\`${vyhalla.memberCount}\`\``
							  }
							],
							"footer": {
							  "text": "Vyhalla Public Audit",
							  "icon_url": "https://trello.com/1/cards/67add144d5afa78d7c598bc7/attachments/67add175357785742dd68e93/download/VAKC_Logo2_NO_GOLD.png"
							},
							"timestamp": new Date(),
							"thumbnail": {
							  "url": thumbnail
							}
						}
						channel.send({ embeds: [embed] });
					}
				}
				
			}

}

module.exports = RJS;
