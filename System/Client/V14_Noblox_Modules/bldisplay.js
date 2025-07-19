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

const back_button = new ButtonBuilder()
	.setCustomId("back")
	.setLabel("Back")
	.setStyle(ButtonStyle.Secondary);
const forward_button = new ButtonBuilder()
	.setCustomId("forward")
	.setLabel("Forward")
	.setStyle(ButtonStyle.Secondary);

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
			if (option === "users") {
				for (x of bindedData) {
					y =
						y +
						`Name: \`\`${x.childKey}\`\` - Latest Username: \`\`${x.childData.latestUsername}\`\` : Permanent: \`\`${x.childData.permanent}\`\` Roblox Accounts: \`\`${x.childData.associatedAccounts.robloxAccounts}\`\` : Discord Accounts: \`\`${x.childData.associatedAccounts.discordAccounts}\`\`\n`;
				}
				reply(y)
			} else {
				return interaction.reply({
					content: `Groups Feature Display is turned off temporarily.`,
				})
			}
			//** .then(function () {
			//	console.log("Reply edited.");
			//	createButtonBuilder(newembed);
			//})
			//
		}
		async function reply(y){
			console.log(y);
			var parts = y.match(/[\s\S]{1,2000}/g) || [];
			for (let i = 0; i < parts.length; i++) {
				interaction.reply({
					content: `${parts[i]}`
				}).catch(console.error);
			}
		}
		async function createButtonBuilder(interactionembed) {
			const start_bldisplay_actionrowbuilder =
				new ActionRowBuilder().addComponents(
					forward_button
				);

			const middle_bldisplay_actionrowbuilder =
				new ActionRowBuilder().addComponents(
					back_button,
					forward_button
				);

			const end_bldisplay_actionrowbuilder =
				new ActionRowBuilder().addComponents(
					back_button
				);

			interaction
				.editReply({
					embeds: [interactionembed],
					components: [start_bldisplay_actionrowbuilder],
				})
				.then(() => console.log(`Reply edited.`))
				.catch(console.error);

			const profile_to_groups_filter = (profile_to_groups_i) =>
				profile_to_groups_i.user.id === interaction.user.id;

			const profile_to_groups_collector =
				interaction.channel.createMessageComponentCollector({
					profile_to_groups_filter,
					time: 20000,
				});

			profile_to_groups_collector.on(`collect`, async (i) => {
				if (i.customId === `back`) {
				
				} else if (i, customId === `forward`) {

				}

			});
		}

	},
};
