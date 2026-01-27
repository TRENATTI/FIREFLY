const {
	EmbedBuilder,
	SlashCommandBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
} = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("echomedia")
		.setDescription("Admin internal command to world broadcast")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("Message to add.")
				.setRequired(true)
		),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
		const messageValue = eval(
			"`" + interaction.options.getString(`message`) + "`"
		);
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
						const embedAA = {
							author: {
								name: interaction.user.username,
								icon_url: interaction.user.displayAvatarURL({
									format: "png",
									dynamic: true,
								}),
							},
							footer: {
								text: interaction.guild.name,
								icon_url: interaction.guild.iconURL({
									format: "png",
									dynamic: true,
								}),
							},
							image: {
								url: interaction.options.getString(`message`),
							},
							timestamp: new Date(),
						};
						channel.send({ embeds: [embedAA] });
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
