module.exports = {
	name: "sn",
	description: "Says news in Embed",
	aliases: ["sn"],
	execute(message, args, client, noblox, admin) {
		stringargs = message.content.slice(process.env.PREFIX.length + 3);
		const embedAA = {
			author: {
				name: message.author.username,
				icon_url: message.author.displayAvatarURL({
					format: "png",
					dynamic: true,
				}),
			},
			footer: {
				text: message.guild.name,
				icon_url: message.guild.iconURL({
					format: "png",
					dynamic: true,
				}),
			},
			description: stringargs,
			image: {
				url: "",
			},
			timestamp: new Date(),
		};
		return message.channel.send({ embeds: [embedAA] });
	},
};
