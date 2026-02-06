const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");
const { AttachmentBuilder} = require('discord.js')
async function MARS(client, noblox, currentUser, admin) {
	var db = admin.database();
	client.on("messageCreate", async (message) => {
		if (message.channel.id !== `1421053057810169866`) return;
		var iter = 0;
		try {
				const guild = await client.guilds.fetch(
					`1314823843315187742`
				);
				if (guild.id) {
					const channel = await guild.channels.fetch(
						`1421059300809379901`
					);
					console.log(
						new Date(),
						"| aa-universe.js | ",
						channel.id,
						`acquired.`
					);
					if (message.attachments.size > 0) {
                           
                            const attachmentsToCopy = message.attachments.map(attachment => new AttachmentBuilder(attachment.proxyURL));

                            await channel.send({
                                content: message.content,
                                files: attachmentsToCopy
                            });
                            message.reply('Attachments copied successfully!');
                        }
				}
			//}
		} catch (error) {
			console.log(new Date(), error);
		}
	});
}

module.exports = MARS;
