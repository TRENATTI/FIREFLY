const {
	SlashCommandBuilder,
	MessageFlags,
} = require("discord.js");

require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verifyunbind")
		.setDescription("Unbind the verification system from this server."),

	subdata: {
		cooldown: 3,
	},

	async execute(interaction, noblox, admin) {
		if (
			interaction.user.id !== "170639211182030850" &&
			interaction.user.id !== "463516784578789376" &&
			interaction.user.id !== "206090047462703104" &&
			interaction.user.id !== "1154775391597240391" &&
			interaction.user.id !== "175922772923383808"
		) {
			return interaction.reply({
				content: "You are not authorized to use this command.",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!interaction.guild) {
			return interaction.reply({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const db = admin.database();

		const bindingRef = db
			.ref("system")
			.child("verification_channels")
			.child(interaction.guild.id);

		const snapshot = await bindingRef.once("value");

		if (!snapshot.exists()) {
			return interaction.reply({
				content: "There is no verification channel bound in this server.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const data = snapshot.val();

		await bindingRef.remove();

		return interaction.reply({
			content:
				`The verification channel <#${data.channelId}> has been unbound.`,
			flags: MessageFlags.Ephemeral,
		});
	},
};