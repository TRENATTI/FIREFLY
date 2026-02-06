const { SlashCommandBuilder } = require("discord.js");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("imagine")
		.setDescription("Enact.")
		.addStringOption((option) =>
			option
				.setName("target")
				.setDescription("Execute.")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option.setName("order").setDescription("66.").setRequired(true)
		)
		.setDefaultMemberPermissions(0),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const data = [];
		const v12_commands = interaction.client.commands_v12;
		const v14_commands = interaction.client.v14_commands;
		const phrase_commands = interaction.client.phrases_v12;
		const arg1 = interaction.options.getString("target");
		const arg2 = interaction.options.getString("order");

		if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104"
		) {
			interaction.reply({
				content: `Starting...`,
				ephemeral: true,
			});
			isAuthorized();
		} else {
			return interaction
				.reply({
					content: `Sorry ${interaction.author}, but only the bot owners can run that command!`,
					ephemeral: true,
				})
				.then((message) =>
					setTimeout(() => message.delete(), 10_000)
				);
		}

		async function isAuthorized() {
			if (arg1 == "v12") {
				Order(1);
			} else if (arg1.toLowerCase() == "v14") {
				Order(2);
			} else if (arg1.toLowerCase() == "phrases") {
				Order(3);
			}
		}
		async function Order(Target) {
			if (Target == 1) {
				v12();
			} else if (Target == 2) {
				v14();
			} else if (Target == 3) {
				phrases();
			}
		}
		async function v12() {
			const command =
				interaction.client.commands_v12.get(arg2) ||
				interaction.client.commands_v12.find(
					(cmd) => cmd.aliases && cmd.aliases.includes(arg2)
				);
			if (!command) return;
			if (command.guildOnly && interaction.channel.type === "dm") {
				return interaction.reply(
					"I can't execute that command inside DMs!"
				);
			}

			if (command.args && !args.length) {
				let reply = `You didn't provide any arguments, ${interaction.author}!`;

				if (command.usage) {
					reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
				}

				return interaction.channel.send(reply);
			}

			if (command.noblox) {
				try {
					command.execute(
						interaction,
						args,
						interaction.client,
						noblox,
						admin
					);
					console.log(
						new Date(),
						"| commmands.js |",
						`${interaction.author.tag} [${interaction.author.id}] successfully ran an message command! (${commandName})`
					);
				} catch (error) {
					interaction.reply(
						"There was an error while executing this command!"
					);
					console.log(
						new Date(),
						"| commmands.js |",
						`${interaction.author.tag} [${interaction.author.id}] failed to run an message command! (${commandName})\nError:`,
						error
					);
				}
			} else {
				try {
					command.execute(interaction, args, interaction.client);
					console.log(
						new Date(),
						"| commmands.js |",
						`${interaction.author.tag} [${interaction.author.id}] successfully ran an message command! (${commandName})`
					);
				} catch (error) {
					interaction.reply({
						content:
							"There was an error while executing this command!",
						ephemeral: true,
					});
					console.log(
						new Date(),
						"| commmands.js |",
						`${interaction.author.tag} [${interaction.author.id}] failed to run an message command! (${commandName})\nError:`,
						error
					);
				}
			}
		}
		async function v14() {
			const command = interaction.client.v14_commands.get(arg2);
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
		}
		async function phrases() {
			const phrase =
				interaction.client.phrases_v12.get(arg2) ||
				interaction.client.phrases_v12.find(
					(phs) => phs.aliases && phs.aliases.includes(arg2)
				);

			try {
				phrase.execute(interaction);
			} catch {
				interaction.reply({
					content: "Unavailable phrase!",
					ephemeral: true,
				});
				console.log("Failed!");
			}
		}
	},
};
