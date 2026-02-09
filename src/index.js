// 

require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Events } = require("discord.js");
const noblox = require("noblox.js");
const admin = require("firebase-admin");


//

function getKeys(flags) {
	if (process.env.DEVELOPER_MODE == "true") {
		if (flags == "token") {
			return process.env.TESTING_TOKEN;
		} else if (flags == "rbxcookie") {
			return process.env.TESTING_RBXCOOKIE;
		} else if (flags == "applicationid") {
			return process.env.TESTING_APPLICATION_ID;
		} else if (flags == "prefix") {
			return process.env.TESTING_PREFIX;
		}
	} else {
		if (flags == "token") {
			return process.env.TOKEN;
		} else if (flags == "rbxcookie") {
			return process.env.RBXCOOKIE;
		} else if (flags == "applicationid") {
			return process.env.APPLICATION_ID;
		} else if (flags == "prefix") {
			return process.env.PREFIX;
		}
	}
}

const token = getKeys("token");
const prefix = getKeys("prefix");
const applicationid = getKeys("applicationid");
const rbxcookie = getKeys("rbxcookie");

const serverSystem = "./server"


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
        // Add other intents as needed for your bot's functionality
    ]
});

try {
    client.login(token);
    console.log('Success');
} catch (err) {
    console.warn('Fail', err);
}
async function getFolders(directoryPath) {
  try {
    // readdir with { withFileTypes: true } returns fs.Dirent objects, 
    // which have methods to check if an entry is a directory or a file.
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    // Filter the entries to only return directories
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(directoryPath, entry.name)); // Get full path

    return folders;
  } catch (err) {
    console.warn(`Error reading directory: ${err}`);
    return [];
  }
}

const serverSystemFolders = await getFolders(serverSystem);
console.log(serverSystemFolders);

for (const folder in serverSystemFolders) {
    const serverFiles = fs
        .readdirSync(folder)
        .filter((file) => file.endsWith(".js"));

    for (const file of serverFiles) {
        try {
            const serverFile = require(`${folder}/${file}`);
            serverFile(client);
            console.log('Success');
        } catch (err) {
            console.warn('Fail', err);
        }
    };
}
