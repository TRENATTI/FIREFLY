const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");
async function CCS(client, noblox, currentUser, admin) {
	var db = admin.database();
	client.on("messageCreate", async (message) => {
		if (message.channel.id !== `1399879687412514968`) return;
		var iter = 0;
		try {
				const guild = await client.guilds.fetch(
					`215221157937283075`
				);
				if (guild.id) {
					const channel = await guild.channels.fetch(
						`1399404099065217094`
					);
					console.log(
						new Date(),
						"| aa-universe.js | ",
						channel.id,
						`acquired.`
					);
					//if (message.attachments.size > 0) {
					//	message.attachments.forEach(attachment => {
				
							return channel.send({
								content: message.content,
					//			files: [{
					//				attachment: attachment.url,
					//				name: attachment.filename
					//			}]
							})
					//	});
					//}
					
				}
			//}
		} catch (error) {
			console.log(new Date(), error);
		}
	});
}

module.exports = CCS;
