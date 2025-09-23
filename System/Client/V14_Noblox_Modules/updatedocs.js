require("dotenv").config();
const fs = require("fs");
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
const { json } = require("stream/consumers");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("updatedocs")
		.setDescription(`Admin internal command. Updates docs.`),
	async execute(interaction, noblox, admin) {
		var db = admin.database();
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
					content: `Sorry ${interaction.author}, but only the owners can run that command!`,
				})
				.then((message) =>
					setTimeout(() => message.delete(), 10_000)
				);
		}

		async function isAuthorized() {
			const isReady = db.ref("szeebe/alapha-universe-docs-ready");

			// Attach an asynchronous callback to read the data at our posts reference
			isReady.once("value", (snapshot) => {
				console.log(snapshot.val());
				if (snapshot.val()) {
					isReady.set(false);
					start();
				}
			});
			async function start() {
				const userdata = [];
				var ref = db
					.ref("szeebe")
					.child("alapha-universe-docs")
					.child("groups");
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
		}
		async function checkRanks(userData) {
			console.log(userData);
			for (let i = 0; i < userData.length; i++) {
				setTimeout(async function timer() {
					try {
						const groupInfo = await noblox.getGroup(
							Number(userData[i].childData.groupId)
						);
						console.log(groupInfo);
						getGroupGithub(groupInfo);
					} catch {
						console.log(
							`Error getting group info for ${userData[i].childKey} [${userData[i].childData.groupId}.`
						);
					}
					async function getGroupGithub(groupInfo) {
						const res = await axios.get(
							`https://raw.githack.com/Alpha-Authority/alapha-universe-docs/main/Docs/Groups/${userData[i].childKey}/getGroup.json`
						);
						var newdatastring = JSON.stringify(res.data);
						var newdatajson = JSON.parse(newdatastring);
						var newdatajsonstring = JSON.stringify(newdatajson);
						const file = fs.writeFileSync(
							`Aud/Docs/Groups/${userData[i].childKey}/getGroup.json`,
							newdatajsonstring,
							"utf8"
						);

						const datafile2 = require(`../../../Aud/Docs/Groups/${userData[i].childKey}/getGroup.json`);
						var str = JSON.stringify(datafile2);
						var strgD = JSON.stringify(groupInfo);
						console.log(datafile2);
						console.log(groupInfo);
						console.log(groupInfo == datafile2);
						console.log(str);
						console.log(strgD);
						console.log(str == strgD);
						if (i == userData.length - 1) {
							const util = require("node:util");
							const exec = util.promisify(
								require("node:child_process").exec
							);

							async function gitPush() {
								const { stdout, stderr } = await exec(
									`sh exec_aud.sh`
								);
								console.log("stdout:", stdout);
								console.error("stderr:", stderr);
							}
							if (str != strgD) {
								gitPush();
							} else {
								console.log(false);
							}
							db.ref("szeebe/alapha-universe-docs-ready").set(
								true
							);
						}
					}
				}, i * 7500);
			}
		}
	},
};
