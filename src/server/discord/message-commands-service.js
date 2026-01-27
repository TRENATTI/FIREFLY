require("dotenv").config();
const fs = require("fs");
const { Collection } = require("discord.js");
const env = require("dotenv");
//

const moduleSystem = "../../client/command-services/messages";

//

const moduleFiles = fs
	.readdirSync(moduleSystem)
	.filter((file) => file.endsWith(".js"));
//

function MCS(client, noblox, currentUser, admin, token, applicationid, prefix) {
	client.commands_v12 = new Collection();
	for (const file of moduleFiles) {
		const commandFile = require("./Modules/" + file);
		client.commands_v12.set(commandFile.name, commandFile);
	}
	for (const file of moduleNobloxFiles) {
		const commandFile = require("./Noblox_Modules/" + file);
		client.commands_v12.set(commandFile.name, commandFile);
	}
	client.on("messageCreate", (message) => {
		if (message.author.bot) return;
		if (!message.content.startsWith(prefix)) return;
		const args = message.content.slice(prefix.length).split(" ");
		const commandName = args.shift().toLowerCase();
		const command =
			client.commands_v12.get(commandName) ||
			client.commands_v12.find(
				(cmd) => cmd.aliases && cmd.aliases.includes(commandName)
			);
		if (!command) return;
		if (command.guildOnly && message.channel.type === "dm") {
			return message.reply("I can't execute that command inside DMs!");
		} // SEE LINE 55 (message.channel.type.dm)

		if (command.args && !args.length) {
			let reply = `You didn't provide any arguments, ${message.author}!`;

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			return message.channel.send(reply);
		}

		try {
			command.execute(message, args, client, noblox, admin);
			console.log(
				new Date(),
				"| commmands.js |",
				`${message.author.tag} [${message.author.id}] successfully ran an message command! (${commandName})`
			);
		} catch (error) {
			//message.reply(
			//	"There was an error while executing this command!"
			//);
			console.log(
				new Date(),
				"| commmands.js |",
				`${message.author.tag} [${message.author.id}] failed to run an message command! (${commandName})\nError:`,
				error
			);
		}
	});
}

module.exports = MCS;
