const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");
async function CCS(client, noblox, currentUser, admin) {
	if (process.env.DEVELOPER_MODE === true) return;
	var db = admin.database();
	client.on("messageCreate", async (message) => {
		if (message.author.bot) return;
		if (process.env.DEVELOPER_MODE == "true" || process.env.DATABASE_MODE == "true") return;
		var iter = 0;
		var ref = db.ref("szeebe").child("aa-universe");
		try {
			ref.limitToLast(10).on("value", (querySnapshot) => {
				querySnapshot.forEach((querySnapshot2) => {
					console.log(
						new Date(),
						"| aa-universe.js | ",
						querySnapshot2.key,
						querySnapshot2.val()
					);
					querySnapshot2.forEach((thisObject) => {
						if (message.guild.id == thisObject.val().serverId) {
							if (
								message.channel.id == thisObject.val().channelId
							) {
								convertData(
									querySnapshot,
									thisObject.val().serverId
								);
							}
						}
					});
				});
			});
			async function convertData(querySnapshot, theServerId) {
				querySnapshot.forEach((querySnapshot2) => {
					console.log(
						new Date(),
						"| aa-universe.js | ",
						querySnapshot2.key,
						querySnapshot2.val()
					);
					querySnapshot2.forEach((data) => {
						console.log(
							new Date(),
							"| aa-universe.js | ",
							data.val().serverId
						);
						var guildId = data.val().serverId.toString();
						console.log(new Date(), "| aa-universe.js | ", guildId);
						createMessage(guildId, data, theServerId);
					});
				});
			}
			async function createMessage(guildId, data, theServerId) {
				const guild = await client.guilds.fetch(
					`${data.val().serverId}`
				);
				if (guild.id != message.guild.id) {
					const channel = await guild.channels.fetch(
						data.val().channelId
					);
					console.log(
						new Date(),
						"| aa-universe.js | ",
						channel.id,
						`acquired.`
					);
					let members = await message.guild.members.fetch().catch(console.log("Erroring"));
					if (isNaN(members.size)) members = "Ratelimited";
					console.log(
						new Date(),
						"| aa-universe.js | ",
						`members acquired.`
					);
					if (message.content.length < 1) return;
					if (
						message.content.startsWith(
							`https://media.discordapp.net/`
						) ||
						message.content.startsWith(
							`https://cdn.discordapp.com/`
						)
					) {
						if (message.content.includes(`.gif`)) {
							const embed = new EmbedBuilder()
								.setAuthor({
									name: message.author.username,
									iconURL: message.author.displayAvatarURL({
										format: "png",
										dynamic: true,
									}),
								})
								.setTimestamp()
								.setFooter({
									text: `Alapha Universe | ${message.guild.name} | ${members.size} Server Members`,
									iconURL: message.guild.iconURL({
										format: "png",
										dynamic: "true",
									}),
								})
								.setImage(
									message.content ||
										`https://trello.com/1/cards/670559c2f0271372c795aab9/attachments/6705f0621d4e9a247369b98a/download/caption.gif`
								);
							channel.send({ embeds: [embed] });
						}
					} else if (
						message.content.startsWith(`https://tenor.com/view`)
					) {
						if (process.env.GOOGLEAPI_TENOR_KEY !== "") {
							let id;
							let payload;
							id = message.content.split("-").pop();
							if (Number.isNaN(Number(id))) return;
							const data = await fetch(
								`https://tenor.googleapis.com/v2/posts?media_filter=gif&limit=1&client_key=${process.env.GOOGLEAPI_CLIENT_TOKEN}&key=${process.env.GOOGLEAPI_TENOR_TOKEN}&ids=${id}`
							);
							if (data.status === 429) {
								payload =
									"https://trello.com/1/cards/670559c2f0271372c795aab9/attachments/670559d4acd55225d93f0dc8/download/caption.gif";
							} else {
								const json = await data.json();
								if (json.error) throw Error(json.error.message);
								if (json.results.length === 0) return;
								payload = json.results[0].media_formats.gif.url;

								const embed = new EmbedBuilder()
									.setAuthor({
										name: message.author.username,
										iconURL:
											message.author.displayAvatarURL({
												format: "png",
												dynamic: true,
											}),
									})
									.setTimestamp()
									.setFooter({
										text: `Alapha Universe | ${message.guild.name} | ${members.size} Server Members`,
										iconURL: message.guild.iconURL({
											format: "png",
											dynamic: "true",
										}),
									})
									.setImage(payload);
								channel.send({ embeds: [embed] });
							}
						}
					} else {
						const embed = new EmbedBuilder()
							.setColor(16747520)
							.setAuthor({
								name: message.author.username,
							})
							.setThumbnail(
								message.author.displayAvatarURL({
									format: "png",
									dynamic: true,
								})
							)
							.setDescription(message.content)
							.setTimestamp()
							.setFooter({
								text:
									`Alapha Universe | ` +
									message.guild.name +
									` | ` +
									members.size +
									` Server Members`,
								iconURL: message.guild.iconURL({
									format: "png",
									dynamic: true,
								}),
							});
						channel.send({ embeds: [embed] });
					}
					const messages = [];
					const game_ref = db
						.ref("szeebe")
						.child("aa-universe-messages");
					//game_ref
					//.orderByKey()
					//.limitToLast(10)
					//.on("value", (querySnapshot) => {
					//querySnapshot.forEach((querySnapshot2) => {
					//console.log(new Date(), '| aa-universe.js | ',
					//querySnapshot2.key,
					//querySnapshot2.val()
					//);
					//querySnapshot2.forEach((thisObject) => {
					//iter = iter + 1;
					//console.log(new Date(), '| aa-universe.js | ', `iteration:`, iter);
					//const thisObjectNew = [];
					//thisObjectNew.push(thisObject.key);
					//thisObjectNew.push(thisObject.val());
					//console.log(new Date(), '| aa-universe.js | ', thisObjectNew);
					//.push(thisObjectNew);
					////.log(new Date(), '| aa-universe.js | ', thisObject.key, thisObject.val());
					//if (iter == 10) {
					//syncGameData(iter, messages, channel, guild, thisObject, game_ref)
					//}
					//});
					//});
					//});
				}
				async function syncGameData(
					iter,
					messages,
					channel,
					guild,
					thisObject,
					game_ref
				) {
					console.log(new Date.now(), "| aa-universe.js | ", `DID`);
					const isReady = db.ref("szeebe/aa-universe-messages-ready");

					// Attach an asynchronous callback to read the data at our posts reference
					isReady.once("value", (snapshot) => {
						console.log(snapshot.val());
						console.log(messages);
						if (snapshot.val()) {
							console.log(
								new Date(),
								iter,
								messages,
								channel,
								guild,
								thisObject,
								game_ref,
								new Date()
							);
							console.log(
								new Date(),
								messages[0][0],
								messages[0][1],
								new Date()
							);
						}
						var messagesVAL1 = `{${messages[0][0]}: ${messages[0][1]}}`;
						messagesVAL1 = stringify(messagesVAL1);

						const messagesJSON_V = JSON.parse(messagesVAL1);
						console.log(
							new Date(),
							true,
							messagesJSON_V,
							new Date()
						);
						//const finalref = game_ref.ref(`${querySnapshot}/${querySnapshot2}`)
						//finalref.remove()
					});
				}
			}
		} catch (error) {
			console.log(new Date(), error);
		}
	});
}

module.exports = CCS;
