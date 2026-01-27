module.exports = {
	name: "serverinfo",
	description: "Server info.",
	aliases: ["server"],
	execute(message, args, client, noblox, admin) {
		return message.reply(
			`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`
		);
	},
};
