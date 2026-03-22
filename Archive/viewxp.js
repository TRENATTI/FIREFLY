require("dotenv").config();
const axios = require("axios");
const Discord = require("discord.js");

module.exports = {
	name: "viewxp",
	noblox: true,
	description: "Views XP.",
	guildOnly: false,
	execute(message, args, client, noblox) {
		function progressBar(percentAge) {
			var percentBar;

			if (percentAge === 0) {
				percentBar =
					":white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (0 <= percentAge && percentAge <= 10) {
				percentBar =
					":white_large_square: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (10 <= percentAge && percentAge <= 20) {
				percentBar =
					":white_large_square: :white_large_square: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (20 <= percentAge && percentAge <= 30) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (30 <= percentAge && percentAge <= 40) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (40 <= percentAge && percentAge <= 50) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_square_button: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (50 <= percentAge && percentAge <= 60) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_square_button: :white_square_button: :white_square_button: :white_square_button:";
			} else if (60 <= percentAge && percentAge <= 70) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_square_button: :white_square_button: :white_square_button:";
			} else if (70 <= percentAge && percentAge <= 80) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_square_button: :white_square_button:";
			} else if (80 <= percentAge && percentAge <= 90) {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_square_button:";
			} else {
				percentBar =
					":white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square: :white_large_square:";
			}
			return percentBar;
		}
		if (!args[0]) {
			axios
				.get("https://api.rowifi.link/v1/users/" + message.author.id)
				.then(function (response) {
					if (response.data.success) {
						getRobloxUsername(true, response.data.roblox_id);
					} else {
						getRobloxUsername(false);
					}
				})
				.catch((error) => console.log(error));
		} else {
			var rblx_id = args[0];
			//var rblx_id;

			var usernameParam = {
				usernames: [rblx_id],
				excludeBannedUsers: true,
			};
			axios
				.post(
					`https://users.roblox.com/v1/usernames/users`,
					usernameParam
				)
				.then(function (response) {
					console.log(response.data);
					if (response.data.data.length == 0) {
						var badEmbed = new Discord.MessageEmbed()
							.setColor(0xf54242)
							.setDescription(
								`User **${args[0]}** doesn't exist!`
							);
						console.log(badEmbed);
						return message.channel.send(badEmbed);
					} else {
						rblx_username = response.data.data[0].name;
						rblx_id = response.data.data[0].id;
						doRoblox(rblx_username, rblx_id);
					}
				})
				.catch((error) => console.log(error));
		}
		function getRobloxUsername(value, roblox) {
			if (!value) {
				return message.channel.send(
					`Sorry ${message.author}, but you do not seem to be verified in the rover database so that I can fetch your account. Please by saying \`\`/verify\`\``
				);
			} else {
				var usernameParam = {
					userIds: [roblox],
					excludeBannedUsers: false,
				};
				axios
					.post(`https://users.roblox.com/v1/users`, usernameParam)
					.then(function (response) {
						console.log(response.data);
						if (response.data.data.length == 0) {
							var badEmbed = new Discord.MessageEmbed()
								.setColor(0xf54242)
								.setDescription(
									`User **${roblox}** doesn't exist!`
								);
							console.log(badEmbed);
							return message.channel.send(badEmbed);
						} else {
							rblx_username = response.data.data[0].name;
							rblx_id = response.data.data[0].id;
							doRoblox(rblx_username, rblx_id);
						}
					})
					.catch((error) => console.log(error));
			}
		}
		function doRoblox(rblx_username, rblx_id) {
			// const sentMessage = await message.channe.send(`Fetching data...`)

			var current_xp = 0;
			var rank_name;
			var roleset_id;

			axios
				.get(
					`${process.env.SA_DATABASEURL}points/groups/Alpha Authority/users/${rblx_id}.json`
				)
				.then(function (response) {
					var current_xp;
					console.log(response.data);
					if (!response.data) {
						xpit(false);
					} else {
						current_xp = response.data.xp;
						xpit(true, current_xp);
					}
				})
				.catch((error) => console.log(error));

			// new total points added together
			function xpit(value, current_xp) {
				if (value === false) {
					return message.channel.send(`User has no profile!`);
				}
				axios
					.get(
						`https://thumbnails.roblox.com/v1/users/avatar?userIds=${rblx_id}&size=720x720&format=Png&isCircular=false`
					)
					.then(function (response) {
						console.log(response.data);
						if (response.data.data.length == 0) {
							//const thumbnail = response.data.data[0].imageUrl
							noblox
								.getRankNameInGroup(790907, rblx_id)
								//axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userid}&size=180x180&format=Png`)
								.then(function (rankid) {
									//var infoEmbed = new Discord.MessageEmbed()
									//.setColor(0xff8c00)
									//.setTitle(`${rblx_username}'s Profile`)
									//.setURL(`https://www.roblox.com/users/${rblx_id}/profile`)
									//.setDescription(`Username: ${rblx_username}\nXP: ${current_xp}\nRank: ${rankid}`)
									//.setThumbnail(response);

									// return embed
									//return message.channel.send( {embed: infoEmbed } )
									var embedAA = {
										title: `${rblx_username}'s Profile`,
										url: `https://www.roblox.com/users/${rblx_id}/profile`,
										author: {
											name: client.user.username,
											icon_url:
												client.user.displayAvatarURL({
													format: "png",
													dynamic: true,
												}),
										},
										color: 0xff8c00,
										footer: {
											text: message.guild.name,
											icon_url: message.guild.iconURL({
												format: "png",
												dynamic: true,
											}),
										},
										description: `Username: ${rblx_username}\nXP: ${current_xp}\nRank: ${rankid}`,
										timestamp: new Date(),
									};
									return message.channel.send({
										embeds: [embedAA],
									});
								})
								.catch((error) => console.log(error));
						} else {
							const thumbnail = response.data.data[0].imageUrl;
							noblox
								.getRankNameInGroup(790907, rblx_id)
								//axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userid}&size=180x180&format=Png`)
								.then(function (rankid) {
									//var infoEmbed = new Discord.MessageEmbed()
									//.setColor(0xff8c00)
									//.setTitle(`${rblx_username}'s Profile`)
									//.setURL(`https://www.roblox.com/users/${rblx_id}/profile`)
									//.setDescription(`Username: ${rblx_username}\nXP: ${current_xp}\nRank: ${rankid}`)
									//.setThumbnail(thumbnail);

									// return embed
									//return message.channel.send( {embed: infoEmbed } )
									var embedAA = {
										title: `${rblx_username}'s Profile`,
										url: `https://www.roblox.com/users/${rblx_id}/profile`,
										author: {
											name: client.user.username,
											icon_url:
												client.user.displayAvatarURL({
													format: "png",
													dynamic: true,
												}),
										},
										color: 0xff8c00,
										footer: {
											text: message.guild.name,
											icon_url: message.guild.iconURL({
												format: "png",
												dynamic: true,
											}),
										},
										description: `Username: ${rblx_username}\nXP: ${current_xp}\nRank: ${rankid}`,
										timestamp: new Date(),
									};
									return message.channel.send({
										embeds: [embedAA],
									});
								})
								.catch((error) => console.log(error));
						}
					})
					.catch((error) => console.log(error));
			}
		}
	},
};
