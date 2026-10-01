const fs = require("fs");
require("dotenv").config();

const { Collection } = require("discord.js");
const { REST } = require("@discordjs/rest"); 
const { Routes } = require("discord.js"); 

const moduleSystem = "./src/client/discord/command-services/slashes";

//

const moduleFiles = fs
	.readdirSync(moduleSystem)
	.filter((file) => file.endsWith(".js")); 

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
	client.v14_commands = new Collection(); 
	client.v14_cooldowns = new Collection();
	
	const commands = [];
	for (const file of moduleFiles) {

		try {
			const commandFile = require(`../../../client/discord/command-services/slashes/${file}`);
			commands.push(commandFile.data.toJSON());
			client.v14_commands.set(commandFile.data.name, commandFile);
			console.log(new Date(),
				"| slashes.js |",
				`Loaded: ./src/client/discord/command-services/slashes/${file}`
			)
		} catch (err) {
			console.log(new Date(), "| V14_commmands.js", err);
		}
	}
	
	const rest = new REST({ version: "10" }).setToken(token);

	(async () => {
		try {
			console.log(
				new Date(),
				`| slashes.js | Started refreshing ${commands.length} application (/) commands.`
			);

			const data = await rest.put(
				Routes.applicationCommands(applicationid),
				{ body: commands }
			);

			console.log(
				new Date(),
				`| slashes.js | Successfully reloaded ${data.length} application (/) commands.`
			);
		} catch (error) {
			console.warn(new Date(), `| commands.js |`, error);
		}
	})();

	client.on("interactionCreate", async (interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = client.v14_commands.get(interaction.commandName); //-- Discord.js V14 Tutorial
			
			if (!command) return;

			const cooldown = command.subdata?.cooldown;

			if (cooldown) {

				const cooldownKey =
					`${interaction.commandName}-${interaction.user.id}`;

				const now = Date.now();
				const expiration = client.v14_cooldowns.get(cooldownKey);

				if (expiration && now < expiration) {

					const remaining =
						((expiration - now) / 1000).toFixed(1);

					return interaction.reply({
						content: `⏳ You are on cooldown for this command. Please wait **${remaining} seconds**.`,
						ephemeral: true,
					});
				}

				// Set cooldown
				client.v14_cooldowns.set(
					cooldownKey,
					now + (cooldown * 1000)
				);

				// Automatically remove it after cooldown
				setTimeout(() => {
					client.v14_cooldowns.delete(cooldownKey);
				}, cooldown * 1000);
			}


			try {
				await command.execute(interaction, noblox, admin);
				console.log(
					new Date(),
					"| slashes.js |",
					`${interaction.user.username} [${interaction.user.id}] successfully ran an interaction! (${interaction.commandName})`
				);
			} catch (error) {
				console.log(
					new Date(),
					"| slashes.js |",
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
