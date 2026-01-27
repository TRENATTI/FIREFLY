module.exports = {
	name: "avatar",
	description: "Avatar.",
	aliases: ["av"],
	execute(message, args, client, noblox, admin) {
		const user = message.mentions.users.first() || message.author;
		return message.reply(
			`\`\`${user.tag}\`\`'s avatar: ${user.displayAvatarURL({
				format: "png",
				dynamic: true,
			})}?size=4096`
		);
	},
};
