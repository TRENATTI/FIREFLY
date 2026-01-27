const fs = require("fs");
require("dotenv").config();
//const Discord = require('discord.js') -- Discord V12
const { Collection } = require("discord.js");
const { REST } = require("@discordjs/rest"); // -- Discord V14
const { Routes } = require("discord.js"); // -- Discord V14

//const moduleSystem = './System/Client/Modules'  // -- Discord.js V12
//const moduleNobloxSystem = './System/Client/Noblox_Modules' // -- Discord.js V12
const moduleSystem = "./System/Client/V14_Modules"; // -- Discord.js V14
const moduleNobloxSystem = "./System/Client/V14_Noblox_Modules"; // -- Discord.js V14
//

//const moduleFiles = fs.readdirSync(moduleSystem).filter(file => file.endsWith('.js'));  // -- Discord.js V12
//const moduleNobloxFiles = fs.readdirSync(moduleNobloxSystem).filter(file => file.endsWith('.js'));  // -- Discord.js V12
const moduleFiles = fs
	.readdirSync(moduleSystem)
	.filter((file) => file.endsWith(".js")); // -- Discord.js V14
const moduleNobloxFiles = fs
	.readdirSync(moduleNobloxSystem)
	.filter((file) => file.endsWith(".js")); // -- Discord.js V14

//

//console.log(test([{Type: 'embed', Data: 'yes'},{Type: 'actionrowbuilder', Data: [{type: 2, components: [{type: 1, label: 'yes', style: 1, custom_id: '5'}]}]}]))

function commands(
	client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix
) {
	//client.commands = new Discord.Collection() -- Discord.js V12
	client.v14_commands = new Collection(); //-- Discord.js V14
	const commands = [];
	for (const file of moduleFiles) {
		//const commandFile = require('./Modules/' + file); commandFile) // -- Discord.js V12
		//client.commands.set(`normal.${commandFile.name}`, commandFile) // -- Discord.js V12

		// -- V Discord.js V14 V

		try {
			const commandFile = require(`./V14_Modules/${file}`);
			commands.push(commandFile.data.toJSON());
			client.v14_commands.set(commandFile.data.name, commandFile);
		} catch (err) {
			console.log(new Date(), "| V14_commmands.js", err);
		}

		// -- ^ Discord.js V14 ^
	}
	for (const file of moduleNobloxFiles) {
		//const commandFile = require('./Noblox_Modules/' + file);  // -- Discord.js V12
		//client.commands.set(`roblox.${commandFile.name}`, commandFile) // -- Discord.js V12

		// -- V Discord.js V14 V

		try {
			const commandFile = require(`./V14_Noblox_Modules/${file}`);
			commands.push(commandFile.data.toJSON());
			client.v14_commands.set(commandFile.data.name, commandFile);
		} catch (err) {
			console.log(new Date(), "| V14_commmands.js", err);
		}

		// -- ^ Discord.js V14 ^
	}

	//const rest = new REST({ version: '10' }).setToken(token); // -- Discord.js V14

	// -- V Discord.js V12 V

	//client.on('message', message => {
	//    if (message.author.bot || !message.content.startsWith(process.env.PREFIX)) return
	//    const args = message.content.slice(process.env.PREFIX.length).split(' ');
	//    const commandName = args.shift().toLowerCase()
	//    const command = client.commands.get(`normal.${commandName}`)
	//	|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(`normal,.${commandName}`));
	//    const noblox_command = client.commands.get(`roblox.${commandName}`)
	//	|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(`roblox.${commandName}`));
	//    if (command){
	//        if (command.guildOnly && message.channel.type === 'dm'){ // || noblox_command.guildOnly && message.channel.type.type === 'dm') {
	//            return message.reply('I can\'t execute that command inside DMs!');
	//        } // SEE LINE 55 (message.channel.type.dm)
	//
	//
	//        if (command.args && !args.length) {
	//            let reply = `You didn't provide any arguments, ${message.author}!`;
	//            if (command.usage) {
	//                reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
	//            }
	//
	//            return message.channel.send(reply);
	//        }
	//
	//try {
	//    if (command) {
	//        command.execute(message, args, client, admin);
	//    }
	//} catch {
	//    message.reply('Unavailable command!');
	//    console.log('Failed!');
	//}
	//} else if (noblox_command){
	//    if (noblox_command.guildOnly && message.channel.type.type === 'dm') {
	//        return message.reply('I can\'t execute that command inside DMs!');
	//    } // SEE LINE 55 (message.channel.type.dm)
	//
	//
	//    if (noblox_command.args && !args.length) {
	//        let reply = `You didn't provide any arguments, ${message.author}!`;
	//        if (noblox_command.usage){
	//            reply += `\nThe proper usage would be: \`${prefix}${noblox_command.name} ${noblox_command.usage}\``;
	//        }
	//
	//        return message.channel.send(reply);
	//    }
	//
	//    try {
	//        if (noblox_command) {
	//            noblox_command.execute(message, args, noblox, client, admin)
	//        }
	//    } catch {
	//        message.reply('Unavailable command!');
	//        console.log('Failed!');
	//    }
	//}
	// });

	//const rest = new REST({ version: '10' }).setToken(token);

	//(async () => {
	//    try {
	//        console.log(`Started refreshing ${commands.length} application (/) commands.`);
	//
	//        const data = await rest.put(
	//            Routes.applicationGuildCommands(client.client_id),
	//            { body: client.commands },
	//        );
	//
	//        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	//    } catch (error) {
	//        console.error(error);
	//    }
	//})();

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

	//rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands })
	//    .then(data => console.log(`Successfully registered ${data.length} application commands.`))
	//    .catch(console.error);

	client.on("interactionCreate", async (interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = client.v14_commands.get(interaction.commandName); //-- Discord.js V14 Tutorial
			//const command = commands.get(interaction.commandName);
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
