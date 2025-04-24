const { MinecraftServerListPing } = require("minecraft-status");
const { EmbedBuilder, MessageManager } = require("discord.js");
require("dotenv").config();
const { stringify } = require("querystring");
async function mcstatus(client, noblox, currentUser, admin) {
	if (process.env.DEVELOPER_MODE != "true") exec()
	async function exec() {

		var db = admin.database();
		client.once("ready", async () => {
			if (process.env.DEVELOPER_MODE == "true") return;
			var iter = 0;
			//var ref = db.ref("szeebe").child("scriptoria-mc");
			//ref.limitToLast(10).once("value", (querySnapshot) => {
			//	querySnapshot.forEach((querySnapshot2) => {
			//		console.log(querySnapshot2.key, querySnapshot2.val());
			//		querySnapshot2.forEach((thisObject) => {
						//console.log(message.content);

						//	if (message.guild.id == thisObject.val().serverId) {
						//		console.log(true);
						//		if (message.channel.id == thisObject.val().channelId) {
						//			console.log(true);
						sendFLIPPINGDATA(
							"1365069346799357993",//thisObject.val().messageId,
							"857383487546720257",//thisObject.val().channelId,
							"215221157937283075",//hisObject.val().serverId,
							//thisObject.key
						);
						//		}
					//});
				//});
			async function sendData(messageId, channelId, serverId) {
				querySnapshot.forEach((querySnapshot2) => {
					console.log(querySnapshot2.key, querySnapshot2.val());
					querySnapshot2.forEach((data) => {
						console.log(data.val().serverId);
						var guildId = data.val().serverId.toString();
						console.log(guildId);
						sendFLIPPINGDATA(guildId, data, theServerId);
					});
				});
			}
			async function sendFLIPPINGDATA(messageId, channelId, serverId) {
				const guild = await client.guilds.fetch(`${serverId}`);
				const channel = await guild.channels.fetch(channelId);
				const message = await channel.messages.fetch(messageId);
				//.then((message) => {
				console.log(message.id, message.createdTimestamp, message.content);
				setInterval(
				() =>
				MinecraftServerListPing.ping(4, "scriptoria.apexmc.co", 25565, 3000)
					.then((response) => {
						console.log(response);

						if (response.players.sample) {
							console.log(true);
							var dataratatata = []; // Yes the Pokemon
							dataratatata.push(`**Scriptoria MC Server**\n`);
							dataratatata.push(
								`${response.players.online} player(s) online!\n`
							);
							dataratatata.push(`Player list:`);
							var y = ``;
							for (x of response.players.sample) {
								y = y + "``" + x.name + "`` ";
							}
							dataratatata.push(y);
							var desc = ``;
							for (x of dataratatata) {
								desc = desc + `\n` + x;
							}
							const embedAA = {
								author: {
									name: message.client.user.username,
									icon_url:
									message.client.user.displayAvatarURL({
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
								description: desc,
								timestamp: new Date(),
							};
							console.log(response);
							return message.edit({ embeds: [embedAA] });
						} else {
							const embedAA = {
								author: {
									name: message.client.user.username,
									icon_url: message.client.user.displayAvatarURL({
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
								description: `**Scriptoria MC Server**\n\nNo players online!`,
								timestamp: new Date(),
							};
							console.log(response);
							return message.edit({ embeds: [embedAA] });
						}
					})
					.catch((error) => {
						// Error
						console.log(error);
					}),
					15000
				)
			}
		});
	}
}

module.exports = mcstatus;
