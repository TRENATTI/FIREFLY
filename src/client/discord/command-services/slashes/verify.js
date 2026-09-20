const { SlashCommandBuilder, ContainerBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonStyle, MessageFlags, ActionRowBuilder, ButtonBuilder, ComponentType, EmbedBuilder } = require("discord.js");

require("dotenv").config();

const crypto = require("crypto");
const https = require("https");

const { verify_container } = require("./embeds/verify.js");

const groupRoleMap = require("../../verify-services/groupRoleMap");

// ============================================================
// ROBLOX AVATAR
// ============================================================

function fetchAvatar(userId) {
	return new Promise((resolve) => {
		const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?` + `userIds=${userId}` + `&size=150x150` + `&format=Png` + `&isCircular=true`;

		https
			.get(url, (res) => {
				let data = "";

				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					try {
						const json = JSON.parse(data);

						const imageUrl = json.data?.[0]?.imageUrl || null;

						resolve(imageUrl);
					} catch {
						resolve(null);
					}
				});
			})
			.on("error", () => {
				resolve(null);
			});
	});
}

// ============================================================
// GROUP ROLE ASSIGNMENT
// ============================================================

async function assignRolesForUser(interaction, guildId, robloxId, robloxUsername, noblox) {
	const guildGroupMap = groupRoleMap[guildId];

	if (!guildGroupMap) {
		return robloxUsername;
	}

	let chosenPrefix = "";

	for (const [groupId, rankToRoles] of Object.entries(guildGroupMap)) {
		try {
			const rank = await noblox.getRankInGroup(Number(groupId), robloxId);

			const roleEntries = rankToRoles[rank];

			if (!Array.isArray(roleEntries)) {
				continue;
			}

			for (const entry of roleEntries) {
				const role = interaction.guild.roles.cache.get(entry.id);

				if (role && !interaction.member.roles.cache.has(role.id)) {
					await interaction.member.roles.add(role).catch(() => {});
				}

				if (entry.prefix && !chosenPrefix) {
					chosenPrefix = entry.prefix;
				}
			}
		} catch {}
	}

	return chosenPrefix + robloxUsername;
}

// ============================================================
// COMMAND
// ============================================================

module.exports = {
	data: new SlashCommandBuilder()

		.setName("verify")

		.setDescription("Verify your account with our services.")
		.addBooleanOption(option =>
				option
					.setName("reverify")
					.setDescription(
						"Force a new verification session."
					)
					.setRequired(false)
			),
	subdata: {
		cooldown: 3,
	},

	async execute(interaction, noblox, admin) {
		const db = admin.database();

		const reverify = interaction.options.getBoolean("reverify") ?? false;
		const discordId = interaction.user.id;

		const guildId = interaction.guild.id;

		// ====================================================
		// FIREBASE USER REFERENCE
		// ====================================================

		const ref = db.ref("system").child("user_verification").child(`discord_${discordId}`);

		try {
			// =================================================
			// CHECK EXISTING FIREBASE RECORD
			// =================================================

			if (existingSnapshot.exists()) {

				const existing =
					existingSnapshot.val();

				if (
					existing.verified === true &&
					existing.robloxUsername &&
					!reverify
				) {

					return interaction.reply({

						content:
							`You’ve already linked your Discord account to **${existing.robloxUsername}**. Try again with the verify commands's reverify field set to **true** if you wish to reverify.`,

						ephemeral: true

					});

				}

			}

			// =================================================
			// GENERATE WEBSITE STATE
			// =================================================

			const state = crypto.randomBytes(32).toString("hex");

			// =================================================
			// CREATE / RESET VERIFICATION SESSION
			// =================================================

			await ref.update({
				verificationGuildID: guildId,

				verified: false,

				statecode: state,

				discordID: discordId,

				verificationMethod: null,

				robloxID: null,

				robloxUsername: null,

				robloxDisplayName: null,

				robloxProfile: null,

				verificationCode: null,

				verifiedAt: null,
			});

			// =================================================
			// INITIAL VERIFICATION MESSAGE
			// =================================================

			await interaction.reply({
				components: [
					new ContainerBuilder()

						.setAccentColor(0x0099ff)

						// =====================================
						// HEADER
						// =====================================

						.addTextDisplayComponents((textDisplay) => textDisplay.setContent("# Verify"))

						.addSeparatorComponents((separator) => separator)

						// =====================================
						// WEBSITE
						// =====================================

						.addSectionComponents((section) =>
							section

								.addTextDisplayComponents((textDisplay) => textDisplay.setContent("## Roblox Account Verifier\n" + "Verify your Roblox account using our website."))

								.setButtonAccessory((button) =>
									button

										.setLabel("Verify with Website")

										.setStyle(ButtonStyle.Link)

										.setURL(`https://auth.trenati.dev/?state=${encodeURIComponent(state)}`),
								),
						)

						.addSeparatorComponents((separator) => separator)

						// =====================================
						// USER DESCRIPTION
						// =====================================

						.addSectionComponents((section) =>
							section

								.addTextDisplayComponents((textDisplay) => textDisplay.setContent("## User Description\n" + "Verify by placing a verification code in your Roblox About Me."))

								.setButtonAccessory((button) =>
									button

										.setCustomId("verify_description")

										.setLabel("Verify with User Description")

										.setStyle(ButtonStyle.Primary),
								),
						),
				],

				ephemeral: true,

				flags: MessageFlags.IsComponentsV2,

				withResponse: false,
			});

			// =================================================
			// GET MESSAGE
			// =================================================

			const message = await interaction.fetchReply();

			// =================================================
			// WAIT FOR DESCRIPTION BUTTON
			// =================================================

			const descriptionButton = await message
				.awaitMessageComponent({
					componentType: ComponentType.Button,

					time: 120000,

					filter: (componentInteraction) => componentInteraction.user.id === discordId && componentInteraction.customId === "verify_description",
				})
				.catch(() => null);

			// =================================================
			// NO DESCRIPTION BUTTON
			//
			// This is normal if they use the website instead.
			// =================================================

			if (!descriptionButton) {
				return;
			}

			// =================================================
			// DESCRIPTION MODAL
			// =================================================

			const modal = new ModalBuilder()

				.setCustomId("verify_description_modal")

				.setTitle("Verify with User Description");

			const usernameInput = new TextInputBuilder()

				.setCustomId("roblox_username")

				.setLabel("Roblox Username")

				.setPlaceholder("Enter your Roblox username")

				.setStyle(TextInputStyle.Short)

				.setRequired(true)

				.setMinLength(3)

				.setMaxLength(20);

			modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));

			await descriptionButton.showModal(modal);

			// =================================================
			// WAIT FOR MODAL
			// =================================================

			const modalSubmit = await descriptionButton
				.awaitModalSubmit({
					time: 120000,

					filter: (modalInteraction) => modalInteraction.user.id === discordId && modalInteraction.customId === "verify_description_modal",
				})
				.catch(() => null);

			if (!modalSubmit) {
				return;
			}

			await modalSubmit.deferReply({
				ephemeral: true,
			});

			// =================================================
			// GET ROBLOX USERNAME
			// =================================================

			const username = modalSubmit.fields.getTextInputValue("roblox_username").trim();

			// =================================================
			// GET ROBLOX USER ID
			// =================================================

			let userId;

			try {
				userId = await noblox.getIdFromUsername(username);
			} catch {
				return modalSubmit.editReply({
					content: `Could not find Roblox user **"${username}"**.`,
				});
			}

			// =================================================
			// GENERATE DESCRIPTION CODE
			// =================================================

			const verificationCode = `VER-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

			// =================================================
			// UPDATE SAME FIREBASE RECORD
			// =================================================

			await ref.update({
				verificationMethod: "description",

				robloxID: String(userId),

				robloxUsername: username,

				verificationCode: verificationCode,

				verified: false,
			});

			// =================================================
			// AVATAR
			// =================================================

			const avatarUrl = await fetchAvatar(userId);

			// =================================================
			// DESCRIPTION VERIFICATION EMBED
			// =================================================

			const verifyEmbed = new EmbedBuilder()

				.setTitle("Verification Process")

				.setColor("DarkBlue")

				.setDescription(`To verify that **${username}** is your Roblox account:\n\n` + `1. Visit [**your profile**](https://www.roblox.com/users/${userId}/profile)\n` + `2. Add this code to your **About Me**:\n` + `\`\`\`${verificationCode}\`\`\`\n` + `3. Click **Confirm** below once you've done it.`)

				.setThumbnail(avatarUrl)

				.setFooter({
					text: interaction.client.user.username,

					icon_url: interaction.client.user.displayAvatarURL({
						format: "png",

						dynamic: true,
					}),
				})

				.setTimestamp();

			// =================================================
			// CONFIRM BUTTON
			// =================================================

			const confirmRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()

					.setCustomId("verify_confirm")

					.setLabel("Confirm")

					.setStyle(ButtonStyle.Primary),
			);

			await modalSubmit.editReply({
				embeds: [verifyEmbed],

				components: [confirmRow],
			});

			// =================================================
			// GET DESCRIPTION MESSAGE
			// =================================================

			const descriptionMessage = await modalSubmit.fetchReply();

			// =================================================
			// WAIT FOR CONFIRM
			// =================================================

			const confirmation = await descriptionMessage
				.awaitMessageComponent({
					componentType: ComponentType.Button,

					time: 60000,

					filter: (componentInteraction) => componentInteraction.user.id === discordId && componentInteraction.customId === "verify_confirm",
				})
				.catch(() => null);

			// =================================================
			// TIMEOUT
			// =================================================

			if (!confirmation) {
				await ref
					.update({
						verificationMethod: null,

						robloxID: null,

						robloxUsername: null,

						verificationCode: null,
					})
					.catch(() => {});

				const timeoutEmbed = new EmbedBuilder()

					.setTitle("Timed Out")

					.setDescription("You didn’t confirm in time. Start again with `/verify`.")

					.setColor("#9D4D4D")

					.setFooter({
						text: interaction.client.user.username,

						icon_url: interaction.client.user.displayAvatarURL({
							format: "png",

							dynamic: true,
						}),
					})

					.setTimestamp();

				return modalSubmit.editReply({
					embeds: [timeoutEmbed],

					components: [],
				});
			}

			// =================================================
			// DISABLE CONFIRM BUTTON
			// =================================================

			if (!confirmation.deferred && !confirmation.replied) {
				await confirmation.deferUpdate().catch(() => {});
			}

			await modalSubmit.editReply({
				components: [new ActionRowBuilder().addComponents(ButtonBuilder.from(confirmRow.components[0]).setDisabled(true))],
			});

			// =================================================
			// READ FIREBASE RECORD
			// =================================================

			const verificationSnapshot = await ref.get();

			if (!verificationSnapshot.exists()) {
				return modalSubmit.editReply({
					content: "Your verification session could not be found.",

					embeds: [],

					components: [],
				});
			}

			const verification = verificationSnapshot.val();

			// =================================================
			// VERIFY CODE STILL MATCHES
			// =================================================

			if (verification.verificationCode !== verificationCode) {
				return modalSubmit.editReply({
					content: "Your verification session is no longer valid.",

					embeds: [],

					components: [],
				});
			}

			// =================================================
			// GET ROBLOX DESCRIPTION
			// =================================================

			let blurb;

			try {
				blurb = await noblox.getBlurb(userId);
			} catch (error) {
				console.warn("Could not retrieve Roblox description:", error);

				return modalSubmit.editReply({
					content: "Could not retrieve the Roblox profile description. Please try again.",

					embeds: [],

					components: [],
				});
			}

			// =================================================
			// CHECK DESCRIPTION
			// =================================================

			if (!blurb || !blurb.includes(verificationCode)) {
				const failEmbed = new EmbedBuilder()

					.setTitle("Verification Failed")

					.setDescription("Make sure the code is in your Roblox profile and try again.")

					.setColor("#9D4D4D")

					.setFooter({
						text: interaction.client.user.username,

						icon_url: interaction.client.user.displayAvatarURL({
							format: "png",

							dynamic: true,
						}),
					})

					.setTimestamp();

				return modalSubmit.editReply({
					embeds: [failEmbed],

					components: [],
				});
			}

			// =================================================
			// ASSIGN GROUP ROLES
			// =================================================

			const finalNickname = await assignRolesForUser(interaction, guildId, userId, username, noblox);

			// =================================================
			// UPDATE DISCORD NICKNAME
			// =================================================

			await interaction.member.setNickname(finalNickname).catch(() => {});

			// =================================================
			// MARK FIREBASE VERIFIED
			// =================================================

			await ref.update({
				verified: true,

				verificationMethod: "description",

				robloxID: String(userId),

				robloxUsername: username,

				verificationCode: null,

				statecode: null,

				verifiedAt: Date.now(),
			});

			// =================================================
			// SUCCESS EMBED
			// =================================================

			const successEmbed = new EmbedBuilder()

				.setTitle("Verification Successful")

				.setColor("DarkBlue")

				.setDescription(`Successfully linked Roblox user **${username}**.`)

				.setThumbnail(avatarUrl)

				.setFooter({
					text: interaction.client.user.username,

					icon_url: interaction.client.user.displayAvatarURL({
						format: "png",

						dynamic: true,
					}),
				})

				.setTimestamp();

			await modalSubmit.editReply({
				embeds: [successEmbed],

				components: [],
			});
		} catch (error) {
			console.warn("Verification command error:", error);

			if (!interaction.replied && !interaction.deferred) {
				await interaction
					.reply({
						content: "An error occurred while starting verification.",

						ephemeral: true,
					})
					.catch(() => {});
			}
		}
	},
};
