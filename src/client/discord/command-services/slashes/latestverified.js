const {
	SlashCommandBuilder,
	EmbedBuilder,
} = require("discord.js");

require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("latestverified")
		.setDescription("Shows the 10 most recently verified users."),

	subdata: {
		cooldown: 3,
	},

	async execute(interaction, noblox, admin) {

		// ============================================================
		// OWNER AUTHORIZATION
		// ============================================================

		if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104" ||
			interaction.user.id == "1154775391597240391" ||
			interaction.user.id == "175922772923383808"
		) {
			await interaction.reply({
				content: `Check database for latest verified users...`,
			});

			// Continue with the command
		} else {
			return interaction
				.reply({
					content: `Sorry ${interaction.user}, but only the owners can run that command!`,
					ephemeral: true,
				});
		}

		const db = admin.database();

		try {
			// ============================================================
			// GET LATEST VERIFIED USERS + TOTAL VERIFIED COUNT
			// ============================================================

			const verificationRef = db.ref("system/user_verification");

			const [latestSnapshot, totalVerifiedSnapshot] = await Promise.all([
				verificationRef
					.orderByChild("verifiedAt")
					.limitToLast(10)
					.get(),

				verificationRef
					.orderByChild("verified")
					.equalTo(true)
					.get(),
			]);

			// ============================================================
			// COUNT TOTAL VERIFIED USERS
			// ============================================================

			const totalVerified = totalVerifiedSnapshot.exists()
				? totalVerifiedSnapshot.numChildren()
				: 0;

			// ============================================================
			// CHECK LATEST USERS
			// ============================================================

			if (!latestSnapshot.exists()) {
				return interaction.editReply({
					content: "There are no verified users yet.",
				});
			}

			// ============================================================
			// BUILD USER LIST
			// ============================================================

			const users = [];

			latestSnapshot.forEach((childSnapshot) => {
				const data = childSnapshot.val();

				if (data.verified !== true) {
					return;
				}

				users.push({
					discordID: data.discordID || null,
					robloxID: data.robloxID || null,
					robloxUsername: data.robloxUsername || "Unknown",
					robloxDisplayName: data.robloxDisplayName || null,
					verifiedAt: data.verifiedAt || 0,
					verificationMethod: data.verificationMethod || "unknown",
				});
			});

			// ============================================================
			// SORT NEWEST FIRST
			// ============================================================

			users.sort((a, b) => b.verifiedAt - a.verifiedAt);

			const latestUsers = users.slice(0, 10);

			if (latestUsers.length === 0) {
				return interaction.editReply({
					content: "There are no verified users yet.",
				});
			}

			// ============================================================
			// FORMAT USERS
			// ============================================================

			const description = latestUsers
				.map((user, index) => {
					const discordMention = user.discordID
						? `<@${user.discordID}>`
						: "Unknown Discord User";

					const robloxLink = user.robloxID
						? `[${user.robloxUsername}](https://www.roblox.com/users/${user.robloxID}/profile)`
						: `**${user.robloxUsername}**`;

					const verifiedDate = user.verifiedAt
						? `<t:${Math.floor(user.verifiedAt / 1000)}:R>`
						: "Unknown";

					return (
						`**${index + 1}.** ${robloxLink}\n` +
						`> Discord: ${discordMention}\n` +
						`> Method: \`${user.verificationMethod}\`\n` +
						`> Verified: ${verifiedDate}`
					);
				})
				.join("\n\n");

			// ============================================================
			// EMBED
			// ============================================================

			const embed = new EmbedBuilder()
				.setTitle("Latest Verified Users")
				.setDescription(description)
				.addFields({
					name: "Verification Statistics",
					value: `**${totalVerified.toLocaleString()}** people have verified so far.`,
					inline: false,
				})
				.setColor("DarkBlue")
				.setFooter({
					text: interaction.guild.name,
					iconURL: interaction.guild.iconURL({
						format: "png",
						dynamic: true,
					}),
				})
				.setTimestamp();

			// ============================================================
			// SEND RESULT
			// ============================================================

			return interaction.editReply({
				content: null,
				embeds: [embed],
			});

		} catch (error) {
			console.error("Latest verified users error:", error);

			return interaction.editReply({
				content: "Unable to retrieve the latest verified users.",
			});
		}
	},
};