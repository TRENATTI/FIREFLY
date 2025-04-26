const {
	EmbedBuilder,
	SlashCommandBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
} = require("discord.js");
const { message } = require("noblox.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("echo2")
		.setDescription("Admin internal command to world broadcast")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("Message to add.")
				.setRequired(true)
		)
		.addBooleanOption((option) =>
			option
				.setName("mention")
				.setDescription("Mention everyone.")
				.setRequired(false)
		),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
		const messageValue = eval(
			"`" + interaction.options.getString(`message`) + "`"
		);
		const mentionValue = interaction.options.getBoolean(`mention`)
		async function isAuthorized() {
			var db = admin.database();
			const guilddata = [];
			var ref = db
				.ref("szeebe")
				.child("au-world-messages")
				.child("guilds");
			ref.once("value", (snapshot) => {
				snapshot.forEach((childSnapshot) => {
					var childKey = childSnapshot.key;
					var childData = childSnapshot.val();
					console.log(childKey, childData);
					guilddata.push({ childKey, childData });
				});
				checkData(guilddata);
			});
		}
		async function checkData(guildData) {
			console.log(guildData);
			for (let i = 0; i < guildData.length; i++) {
				setTimeout(async function timer() {
					try {
						const guild = await interaction.client.guilds.fetch(
							guildData[i].childData.serverId
						);
						const channel = await guild.channels.fetch(
							guildData[i].childData.channelId
						);
						if (mentionValue == true) {
							channel.send({ content: `${messageValue}\n-# SENT BY: ${interaction.user.username} • FROM: ${interaction.guild.name} || @everyone ||` });
						} else {
							channel.send({ content: `${messageValue}\n-# SENT BY: ${interaction.user.username} • FROM: ${interaction.guild.name}` });
						}

					} catch (error) {
						console.log(error);
					}
				});
			}
		}
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
					message.delete({ timeout: 5000, reason: "delete" })
				);
		}
	},
};
