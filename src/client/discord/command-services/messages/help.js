require("dotenv").config();
const prefix = process.env.PREFIX;

module.exports = {
	name: "help",
	description: "List all of my commands or info about a specific command.",
	aliases: ["commands", "cmds"],
	usage: "[command name]",
	cooldown: 5,
	execute(message, args, client) {
		const data = [];
		const commands = client.commands_v12;

		if (!args.length) {
			const v12_commands = client.commands_v12;
			const v14_commands = client.v14_commands;
			const phrase_commands = client.phrases_v12;
			data.push();
			data.push(
				"Here's a list of message based commands using my prefix!"
			);
			data.push(
				"``" +
					v12_commands
						.map((command) => command.name)
						.sort()
						.join("``, ``") +
					"``"
			);

			data.push(`\nHere's a list of my slash commands!`);
			data.push(
				"``" +
					v14_commands
						.map((command) => command.data.name)
						.sort()
						.join("``, ``") +
					"``"
			);
			data.push(`\nHere's a list of my phrases!`);
			data.push(
				"``" +
					phrase_commands
						.map((phrase) => phrase.name)
						.sort()
						.join("``, ``") +
					"``"
			);
			//data.push(`\nYou can send \`${process.env.PREFIX}help [command name]\` to get info on a specific command!`);
			var x;
			var y = ``;
			for (x of data) {
				y = y + `\n` + x;
			}
			const embedAA = {
				author: {
					name: client.user.username,
					icon_url: client.user.displayAvatarURL({
						format: "png",
						dynamic: true,
					}),
				},
				color: 0x0099ff,
				footer: {
					text: message.guild.name,
					icon_url: message.guild.iconURL({
						format: "png",
						dynamic: true,
					}),
				},
				description: y,
				timestamp: new Date(),
			};
			return message.reply({ embeds: [embedAA] });
			//    .then(() => {
			//        if (message.channel.type === 'dm') return;
			//        // message.reply('I\'ve sent you a DM with all my commands!');
			//    })
			//    .catch(error => {
			//        //console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
			//        //message.reply('It seems like I can\'t DM you! Do you have DMs disabled?');
			//    });
		} else {
			const name = args[0].toLowerCase();
			const command =
				commands.get(name) ||
				commands.find((c) => c.aliases && c.aliases.includes(name));

			if (!command) {
				return message.reply("That's not a valid command!");
			}

			data.push(`**Name:** ${command.name}`);

			if (command.aliases)
				data.push(`**Aliases:** ${command.aliases.join(", ")}`);
			if (command.description)
				data.push(`**Description:** ${command.description}`);
			if (command.usage)
				data.push(
					`**Usage:** ${prefix}${command.name} ${command.usage}`
				);

			//data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

			var x;
			var y = ``;
			for (x of data) {
				y = y + `\n` + x;
			}
			const embedAA = {
				author: {
					name: client.user.username,
					icon_url: client.user.displayAvatarURL({
						format: "png",
						dynamic: true,
					}),
				},
				color: 0x0099ff,
				footer: {
					text: message.guild.name,
					icon_url: message.guild.iconURL({
						format: "png",
						dynamic: true,
					}),
				},
				description: y,
				timestamp: new Date(),
			};
			return message.reply({ embeds: [embedAA] });
		}
	},
};
