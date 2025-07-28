const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");
async function CCS(client, noblox, currentUser, admin) {
	var db = admin.database();
	client.on("messageCreate", async (message) => {
		if (message.author.id !== `159985870458322944`) return;
		if (message.channel.id !== `1394340938939240478`) return;
		var iter = 0;
		try {
				const guild = await client.guilds.fetch(
					`215221157937283075`
				);
				if (guild.id == message.guild.id) {
					const channel = await guild.channels.fetch(
						`1399398960552087592`
					);
					console.log(
						new Date(),
						"| aa-universe.js | ",
						channel.id,
						`acquired.`
					);
					if (message.attachments.size > 0) {
						message.attachments.forEach(attachment => {
							console.log(new Date(),
						"| aa-universe.js | ",`Attachment Name: ${attachment.filename}`);
							console.log(new Date(),
						"| aa-universe.js | ",`Attachment URL: ${attachment.url}`);
							return channel.send({
								content: message.content,
								files: [{
									attachment: attachment.url,
									name: attachment.filename
								}]
							})
						});
					}
					
				}
			//}
		} catch (error) {
			console.log(new Date(), error);
		}
	});
}

module.exports = CCS;
