const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");
async function CCS(client, noblox, currentUser, admin) {
	var db = admin.database();
	client.on("messageCreate", async (message) => {
		if (message.channel.id !== `1402769833111846952`) return;
		var iter = 0;
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
				const ARGS = message.content.split("&&")
				const URL = ARGS[0]
				const TITLE = ARGS[1]
				if (TITLE.toLowerCase().search("the eternal conflict")) {
					return channel.send({
						content: `Trenati is now livestreaming a developer session! ${URL}`
					})
				}		
			}
		} catch (error) {
			console.log(new Date(), error);
		}
	});
}

module.exports = CCS;
