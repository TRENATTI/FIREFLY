require("dotenv").config();
const axios = require("axios");
const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");
const wait = require("node:timers/promises").setTimeout;
const { query } = require("express");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("updateranks")
		.setDescription(`View a user's group profile. V2`)
		.addStringOption((option) =>
			option
				.setName("username")
				.setDescription(`View a user's group profile. V2`)
				.setRequired(false)
		),
	async execute(interaction, noblox, admin) {
		if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104" ||
			interaction.user.id == "1154775391597240391"
		) {
			interaction.reply({
				content: `Starting...`,
			});
			isAuthorized();
		} else {
			return interaction
				.reply({
					content: `Sorry ${message.author}, but only the owners can run that command!`,
				})
				.then((message) =>
					setTimeout(() => message.delete(), 10_000)
				);
		}

		async function isAuthorized() {
			var db = admin.database();
			const userdata = [];
			var ref = db
				.ref("points")
				.child("groups")
				.child("Alpha Authority")
				.child("users");
			ref.once("value", (snapshot) => {
				snapshot.forEach((childSnapshot) => {
					var childKey = childSnapshot.key;
					var childData = childSnapshot.val();
					console.log(childKey, childData);
					userdata.push({ childKey, childData });
				});
				checkRanks(userdata);
			});
		}
		async function checkRanks(userData) {
			console.log(userData);
			for (let i = 0; i < userData.length; i++) {
				setTimeout(async function timer() {
					try {
						const rankId = await noblox.getRankInGroup(
							790907,
							Number(userData[i].childKey)
						);
						console.log(rankId);
						if (
							rankId == 2 ||
							rankId == 3 ||
							rankId == 91 ||
							rankId == 92 ||
							rankId == 93 ||
							rankId == 94 ||
							rankId == 95 ||
							rankId == 96 ||
							rankId == 97
						) {
							try {
								if (
									Number(userData[i].childData.xp) >= 1 &&
									Number(userData[i].childData.xp) < 5
								) {
									if (rankId !== 91) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											91
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is alrready in the correct rank.`
										);
									}
								}
								if (
									Number(userData[i].childData.xp) >= 5 &&
									Number(userData[i].childData.xp) < 10
								) {
									if (rankId !== 92) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											92
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is alrready in the correct rank.`
										);
									}
								}
								if (
									Number(userData[i].childData.xp) >= 10 &&
									Number(userData[i].childData.xp) < 25
								) {
									if (rankId !== 93) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											93
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is alrready in the correct rank.`
										);
									}
								}
								if (
									Number(userData[i].childData.xp) >= 25 &&
									Number(userData[i].childData.xp) < 50
								) {
									if (rankId !== 94) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											94
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is alrready in the correct rank.`
										);
									}
								}
								if (
									Number(userData[i].childData.xp) >= 50 &&
									Number(userData[i].childData.xp) < 75
								) {
									if (rankId !== 95) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											95
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is alrready in the correct rank.`
										);
									}
								}
								if (
									Number(userData[i].childData.xp) >= 75 &&
									Number(userData[i].childData.xp) < 100
								) {
									if (rankId !== 96) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											96
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is alrready in the correct rank.`
										);
									}
								}
								if (Number(userData[i].childData.xp) >= 100) {
									if (rankId !== 97) {
										noblox.setRank(
											790907,
											Number(userData[i].childKey),
											97
										);
										interaction.channel.send({
											content: `Set rank for ${userData[i].childKey}`,
										});
										console.log(
											`Set rank for ${userData[i].childKey}`
										);
									} else {
										interaction.channel.send({
											content: `${userData[i].childKey} is already in the correct rank.`,
										});
										console.log(
											`${userData[i].childKey} is already in the correct rank.`
										);
									}
								}
							} catch {
								console.log(
									`Error setting rank for ${userData[i].childKey}, data ${userData[i].childData.xp}`
								);
							}
						}
					} catch {
						console.log(
							`Error getting rank for ${userData[i].childKey}`
						);
					}
				}, i * 7500);
			}
		}
	},
};
