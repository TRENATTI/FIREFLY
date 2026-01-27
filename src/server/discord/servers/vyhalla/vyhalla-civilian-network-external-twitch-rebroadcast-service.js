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
				`1314823843315187742`
			);
			if (guild.id) {
				const channel = await guild.channels.fetch(
					`1402875758841696271`
				);
				console.log(
					new Date(),
					"| vyhalla-civilian-network-external-twitch-rebroadcast-service.js | ",
					channel.id,
					`acquired.`
				);
				const ARGS = message.content.split("&&")
				const URL = ARGS[0]
				const TITLE = ARGS[1]
				if (TITLE.toLowerCase().search("vyhalla")) {
					return channel.send({
						content: `Trenati is now livestreaming a developer session! ${URL} <@&1402785004060414133>`
					})
				}		
			}
		} catch (error) {
			console.log(new Date(), error);
		}
	});
}

module.exports = CCS;
