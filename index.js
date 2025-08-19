// Structure Setup

// node_modules
// modules
// settings
// events
// startup
// functions

// // //

require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
const noblox = require("noblox.js");
const admin = require("firebase-admin");

// // //

const clientSystem = "./System/Client";
const serverSystem = "./System/Server"

// // //

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

//

function startApp(currentUser, client, admin) {
	const clientFiles = fs
		.readdirSync(clientSystem)
		.filter((file) => file.endsWith(".js"));

	for (const file of clientFiles) {
		const clientFile = require(`./System/Client/${file}`);
		clientFile(
			client,
			noblox,
			currentUser,
			admin,
			token,
			applicationid,
			prefix
		);
	};

	const serverFiles = fs
		.readdirSync(serverSystem)
		.filter((file) => file.endsWith(".js"));

	for (const file of serverFiles) {
		//const serverFile = require(`./System/Server/${file}`);
		//serverFile();
	};
	const server = require(`./System/Server/server.js`)
	server();
}

//

async function startFirebase(currentUser, client) {
	const SA_PRIVATE_KEY = process.env.SA_PRIVATE_KEY.split("\\n").join("\n");

	var serviceAccount = {
		type: process.env.SA_TYPE,
		project_id: process.env.SA_PROJECT_ID,
		private_key_id: process.env.SA_PRIVATE_KEY_ID,
		private_key: SA_PRIVATE_KEY,
		client_email: process.env.SA_CLIENT_EMAIL,
		client_id: process.env.SA_CLIENT_ID,
		auth_uri: process.env.SA_AUTH_URI,
		token_uri: process.env.SA_TOKEN_URI,
		auth_provider_x509_cert_url: process.env.SA_AUTH_PROVIDER_X509_CERT_URL,
		client_x509_cert_url: process.env.SA_CLIENT_X509_CERT_URL,
	};

	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: process.env.SA_DATABASEURL,
		databaseAuthVariableOverride: {
			uid: process.env.FIREBASE_AUTHVARIABLEOVERRIDE
		}
	});

	startApp(currentUser, client, admin);
}

async function startNoblox(client) {
	// You MUST call setCookie() before using any authenticated methods [marked by 🔐]
	// Replace the parameter in setCookie() with your .ROBLOSECURITY cookie.
	const currentUser = await noblox.setCookie(`${rbxcookie}`);
	console.log(
		new Date(),
		`| index.js |`,
		`Logged in as ${currentUser.name} [${currentUser.id}]`
	);

	// Do everything else, calling functions and the like.
	startFirebase(currentUser, client);
}

//

async function startDiscord() {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildVoiceStates
		],
	});

	//

	client.login(token);

	startNoblox(client);
}

//

startDiscord();

//
