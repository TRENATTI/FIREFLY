require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");

function WS(client) {
	let i = 0;
	const photos = [
		"https://c.tenor.com/3dL8H0vVT1AAAAAC/tenor.gif",
		"https://c.tenor.com/TKaLVjpWD8IAAAAC/tenor.gif",
		"https://c.tenor.com/VSaRKZVmt0kAAAAC/tenor.gif",
	];

	client.on("guildMemberAdd", (member) => {
		if (process.env.DEVELOPER_MODE == "true") return;
		if (!member.guild.id == 215221157937283075) return;
		embedX = {
			title: "",
			color: 13193877,
			description: `Welcome **${
				member.user.username
			}**! We are glad to see you here, Now you are officially part of **Space Bubble!**\n\nPlease read the <#1235604861949710366> and also get some nice roles from <#1207290853564088320> and <#1235102286670463027>. **And don't forget to say hi!**`,
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
