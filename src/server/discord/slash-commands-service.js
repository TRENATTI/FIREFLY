const fs = require("fs");
require("dotenv").config();

const { Collection } = require("discord.js");
const { REST } = require("@discordjs/rest"); // -- Discord V14
const { Routes } = require("discord.js"); // -- Discord V14

const moduleSystem = "./System/Client/V14_Modules"; // -- Discord.js V14
const moduleNobloxSystem = "./System/Client/V14_Noblox_Modules"; // -- Discord.js V14
//

const moduleFiles = fs
	.readdirSync(moduleSystem)
	.filter((file) => file.endsWith(".js")); // -- Discord.js V14
const moduleNobloxFiles = fs
	.readdirSync(moduleNobloxSystem)
	.filter((file) => file.endsWith(".js")); // -- Discord.js V14

//

function commands(
	client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix
) {
	client.v14_commands = new Collection(); //-- Discord.js V14
	const commands = [];
	for (const file of moduleFiles) {

		try {
			const commandFile = require(`./V14_Modules/${file}`);
			commands.push(commandFile.data.toJSON());
			client.v14_commands.set(commandFile.data.name, commandFile);
		} catch (err) {
			console.log(new Date(), "| V14_commmands.js", err);
		}
	}
	for (const file of moduleNobloxFiles) {

		try {
			const commandFile = require(`./V14_Noblox_Modules/${file}`);
			commands.push(commandFile.data.toJSON());
			client.v14_commands.set(commandFile.data.name, commandFile);
		} catch (err) {
			console.log(new Date(), "| V14_commmands.js", err);
		}

	
	}
	const rest = new REST({ version: "10" }).setToken(token);

	(async () => {
		try {
			console.log(
				new Date(),
				`| V14_commands.js | Started refreshing ${commands.length} application (/) commands.`
			);

			const data = await rest.put(
				Routes.applicationCommands(applicationid),
				{ body: commands }
			);

			console.log(
				new Date(),
				`| V14_commands.js | Successfully reloaded ${data.length} application (/) commands.`
			);
		} catch (error) {
			console.error(new Date(), `| commands.js |`, error);
		}
	})();

	client.on("interactionCreate", async (interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = client.v14_commands.get(interaction.commandName); //-- Discord.js V14 Tutorial
			
			if (!command) return;

			try {
				await command.execute(interaction, noblox, admin);
				console.log(
					new Date(),
					"| V14_commmands.js |",
					`${interaction.user.username} [${interaction.user.id}] successfully ran an interaction! (${interaction.commandName})`
				);
			} catch (error) {
				console.log(
					new Date(),
					"| V14_commmands.js |",
					`${interaction.user.username} [${interaction.user.id}] failed to run an interaction! (${interaction.commandName})\nError:`,
					error
				);
				await interaction.reply({
					content: "There was an error while executing this command!",
					ephemeral: true,
				});
			}
		} else if (interaction.isButton()) {
		}
	});
}

module.exports = commands;
