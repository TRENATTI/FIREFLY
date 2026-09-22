const {
	SlashCommandBuilder,
	ContainerBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
} = require("discord.js");

require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verifybind")
		.setDescription("Bind a channel to the verification system.")
		.addChannelOption(option =>
			option
				.setName("channel")
				.setDescription("The channel to use for verification.")
				.setRequired(true)
		),

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

		const channel = interaction.options.getChannel("channel");

		if (!channel.isTextBased()) {
			return interaction.reply({
				content: "The selected channel must be a text-based channel.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const botMember = interaction.guild.members.me;

		if (!botMember) {
			return interaction.reply({
				content: "I could not find my member information in this server.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const permissions = channel.permissionsFor(botMember);

		if (
			!permissions ||
			!permissions.has("ViewChannel") ||
			!permissions.has("SendMessages") ||
			!permissions.has("EmbedLinks")
		) {
			return interaction.reply({
				content:
					"I need View Channel, Send Messages, and Embed Links permissions in that channel.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const db = admin.database();

		const bindingRef = db
			.ref("system")
			.child("verification_channels")
			.child(interaction.guild.id);

		const existingBinding = await bindingRef.once("value");

		if (existingBinding.exists()) {
			const existingData = existingBinding.val();

			return interaction.reply({
				content:
					`Verification is already bound to <#${existingData.channelId}>.\n` +
					`Use \`/verifyunbind\` before binding another channel.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		await bindingRef.set({
			channelId: channel.id,
			channelName: channel.name,
			guildId: interaction.guild.id,
			boundBy: interaction.user.id,
			boundAt: Date.now(),
		});

		const container = new ContainerBuilder()
			.addTextDisplayComponents(component =>
				component.setContent(
					"# Account Verification\n\n" +
					"Click the button below to begin verifying your Roblox account.\n\n" +
					"Your verification session will be created privately when you click the button."
				)
			)
			.addActionRowComponents(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId("verification_channel_start")
						.setLabel("Verify")
						.setStyle(ButtonStyle.Primary)
				)
			);

		await channel.send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		return interaction.reply({
			content: `The verification system has been bound to <#${channel.id}>.`,
			flags: MessageFlags.Ephemeral,
		});
	},
};