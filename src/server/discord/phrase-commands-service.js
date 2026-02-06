require("dotenv").config();

const fs = require("fs");
const { Collection } = require("discord.js");
const cooldown = new Set();
const cooldownTime = 60000*2

//
const moduleSystem = "../../client/command-services/phrases";


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
					if (p.nocooldown == true) {
						try {
							p.execute(message);
						} catch {
							//message.reply("Unavailable phrase!");
							console.log(new Date(), "| phrases.js |", "Failed!");
						}
					} else {
						if (cooldown.has(true)) return; 
						cooldown.add(true);
						setTimeout(() => {
						cooldown.delete(true);
						}, cooldownTime);
						try {
							p.execute(message);
						} catch {
							//message.reply("Unavailable phrase!");
							console.log(new Date(), "| phrases.js |", "Failed!");
						}
					}
				}
			}); //p.name).sort().join(",")
		} else {
			if (phrase.nocooldown == true) {
				try {
					phrase.execute(message);
				} catch {
					//message.reply("Unavailable phrase!");
					console.log(new Date(), "| phrases.js |", `Failed!`);
				}
			} else {
				if (cooldown.has(true)) return; 
				cooldown.add(true);
				setTimeout(() => {
				cooldown.delete(true);
				}, cooldownTime);
				try {
					phrase.execute(message);
				} catch {
					//message.reply("Unavailable phrase!");
					console.log(new Date(), "| phrases.js |", `Failed!`);
				}
			}
		}
	});
}

module.exports = commands;
