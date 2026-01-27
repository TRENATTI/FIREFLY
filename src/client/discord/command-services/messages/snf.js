module.exports = {
	name: "snf",
	description: "Says news image in Embed",
	aliases: ["snf"],
	execute(message, args) {
		stringargs = message.content.slice(process.env.PREFIX.length + 4);
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
			image: {
				url: stringargs,
			},
			timestamp: new Date(),
		};
		return message.channel.send({ embeds: [embedAA] });
	},
};
