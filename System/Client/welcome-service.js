require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");

function WS(client) {
	let i = 0;
	const photos = [
		"https://cdn.discordapp.com/attachments/809592756946206751/1001874995577892974/welcomegayhaha.gif",
		"https://cdn.discordapp.com/attachments/809592756946206751/1001874994768379914/welcgay3.gif",
		"https://cdn.discordapp.com/attachments/809592756946206751/1001874994013421588/welcgay2.gif",
	];

	client.on("guildMemberAdd", (member) => {
		if (process.env.DEVELOPER_MODE === true) return;
		if (!member.guild.id == 215221157937283075) return;
		embedX = {
			title: "",
			color: 13193877,
			description: `Welcome **${
				member.user.username
			}**! We are glad to see you here, Now you are officially part **of the Alapha Universe**\n\nPlease read the #rules and also get some nice roles from #self-roles. **And don't forget to say hi!**`,
			timestamp: new Date(),
			author: {
				name: "",
			},
			image: {
				url: `${photos[i++ % photos.length]}`,
			},
			thumbnail: {
				url: "",
			},
			footer: {
				text: `${member.user.tag} is our ${member.guild.memberCount} member • ID: ${member.id}`,
			},
			fields: [],
		};
		try {
			member.guild.channels.cache
				.get("710591152113451088")
				.send({ content: `<@${member.id}>`, embeds: [embedX] });
		} catch (err) {
			console.log(new Date(), "| astolfo.js | ", err);
		}
	});
}

module.exports = WS;
