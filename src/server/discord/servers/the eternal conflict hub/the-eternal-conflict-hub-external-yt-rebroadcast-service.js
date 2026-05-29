const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");
async function CCS(client, noblox, currentUser, admin) {
	var db = admin.database();
	client.on("messageCreate", async (message) => {
		if (message.channel.id !== `1402763103803801721`) return;
		const ARGS = message.content.split("&&")
		const URL = ARGS[0]
		const TITLE = ARGS[1]
		if (TITLE.toLowerCase().search("the eternal conflict") !== -1 && TITLE.toLowerCase().search("[livestream" !== -1)) {
			try {
				const guild = await client.guilds.fetch(
					`1382183839606112308`
				);
				if (guild.id) {
					const channel = await guild.channels.fetch(
						`1382194791743361064`
					);
					console.log(
						new Date(),
						"| the-eternal-conflict-hub-external-yt-rebroadcast-service.js | ",
						channel.id,
						`acquired.`
					);
					return channel.send({
						content: `A past developer session has been archived! ${URL}`
					})
				}
			} catch (error) {
				console.log(new Date(), error);
			}
		}
		if (TITLE.toLowerCase().search("the eternal conflict") !== -1 && TITLE.toLowerCase().search("[livestream" == -1)) {
			try {
				const guild = await client.guilds.fetch(
					`1382183839606112308`
				);
				if (guild.id) {
					const channel = await guild.channels.fetch(
						`1382194791743361064`
					);
					console.log(
						new Date(),
						"| the-eternal-conflict-hub-external-yt-rebroadcast-service.js | ",
						channel.id,
						`acquired.`
					);
					return channel.send({
						content: `A new developer release has been showcased! ${URL}`
					})
				}
			} catch (error) {
				console.log(new Date(), error);
			}
		}
	});
}

module.exports = CCS;
