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

module.exports = {
	data: new SlashCommandBuilder()
		.setName("bldisplay")
		.setDescription("Displays current Blacklist.")
		.addStringOption((option) =>
			option
				.setName("option")
				.setDescription("Groups/Users")
				.setRequired(true)
				.addChoices(
					{ name: "Groups", value: "groups" },
					{ name: "Users", value: "users" }
				)
		),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
		const db = admin.database();
		const bindedData = [];
		var ref;
		const option = interaction.options.getString("option");
		console.log(option)
		if (option == "groups"){
			ref = db.ref("blacklist/groups");
			check(ref)
		} else if (option == "users") {
			ref = db.ref("blacklist/users");
			check(ref)
		}
		async function check(ref) {
			ref.once("value", (snapshot) => {
				snapshot.forEach((childSnapshot) => {
					var childKey = childSnapshot.key;
					var childData = childSnapshot.val();
					console.log(childKey, childData);
					bindedData.push({ childKey, childData });
				});
				send(bindedData);
			});
		}
		async function send(bindedData) {
			var y = "";
			var x;
			for (x of bindedData) {
				y =
					y +
					`Name: \`\`${x.childKey}\`\` - ID: \`\`${x.childData.id}\`\` : Permanent: \`\`${x.childData.permanent}\`\`\n`;
			}
			console.log(y);
			return interaction.reply({
				content: `Test command; Data\n${y}}`,
			});
		}
	},
};
