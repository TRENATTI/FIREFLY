require("dotenv").config();

const fs = require("fs");
const { Collection } = require("discord.js");
const cooldown = new Set();
const cooldownTime = 60000*2

//

const moduleSystem = "./System/Client/Phrases";



//

const moduleFiles = fs
	.readdirSync(moduleSystem)
	.filter((file) => file.endsWith(".js"));

//

function commands(client) {
	if (process.env.DEVELOPER_MODE == "true") return;
	client.phrases_v12 = new Collection();
	for (const file of moduleFiles) {
		const phraseFile = require("./Phrases/" + file);
		client.phrases_v12.set(phraseFile.name, phraseFile);
	}
	client.on("messageCreate", (message) => {
		if (message.author.bot) return;
		if (message.client.user.id == 481512678163087363) return;

		if (cooldown.has(true)) return; 
		cooldown.add(true);
		setTimeout(() => {
          cooldown.delete(true);
        }, cooldownTime);
		
		const phraseName = message.content.toLowerCase();
		const phrase =
			client.phrases_v12.get(phraseName) ||
			client.phrases_v12.find(
				(phs) => phs.aliases && phs.aliases.includes(phraseName)
			);
		if (!phrase) {
			client.phrases_v12.forEach((p) => {
				if (!p.wildcard) return;
				if (message.content.toLowerCase().indexOf(p.name) != -1) {
					try {
						p.execute(message);
					} catch {
						//message.reply("Unavailable phrase!");
						console.log(new Date(), "| phrases.js |", "Failed!");
					}
				}
			}); //p.name).sort().join(",")
		} else {
			//if (command.guildOnly && message.channel.type === 'dm') {
			//return message.reply('I can\'t execute that command inside DMs!');
			//} // SEE LINE 55 (message.channel.type.dm)

			//if (command.args && !args.length) {
			//let reply = `You didn't provide any arguments, ${message.author}!`;

			//if (command.usage) {
			//    reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			//}

			//return message.channel.send(reply);
			//}

			try {
				phrase.execute(message);
			} catch {
				//message.reply("Unavailable phrase!");
				console.log(new Date(), "| phrases.js |", `Failed!`);
			}
		}
	});
}

module.exports = commands;
