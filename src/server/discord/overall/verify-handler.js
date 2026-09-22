const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
} = require("discord.js");

require("dotenv").config();

const crypto = require("crypto");
const https = require("https");

module.exports = function (
	client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix
) {
	async function fetchAvatar(userId) {
		return new Promise((resolve) => {
			const url =
				`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}` +
				`&size=150x150&format=Png&isCircular=false`;

			https
				.get(url, (response) => {
					let data = "";

					response.on("data", chunk => {
						data += chunk;
					});

					response.on("end", () => {
						try {
							const json = JSON.parse(data);

							if (
								json.data &&
								json.data[0] &&
								json.data[0].imageUrl
							) {
								return resolve(json.data[0].imageUrl);
							}
						} catch (error) {}

						resolve(null);
					});
				})
				.on("error", () => {
					resolve(null);
				});
		});
	}

	async function assignRolesForUser(guild, robloxUserId) {
		const db = admin.database();

		const bindingsRef = db
			.ref("system")
			.child("role_bindings")
			.child(guild.id);

		const snapshot = await bindingsRef.once("value");

		if (!snapshot.exists()) {
			return {
				rolesAdded: [],
				prefix: null,
			};
		}

		const bindings = snapshot.val();

		const rolesAdded = [];
		let selectedPrefix = null;

		for (const bindingId of Object.keys(bindings)) {
			const binding = bindings[bindingId];

			if (
				!binding ||
				!binding.groupId ||
				typeof binding.rank !== "number" ||
				!binding.discordRoleId
			) {
				continue;
			}

			try {
				const rank = await noblox.getRankInGroup(
					Number(binding.groupId),
					Number(robloxUserId)
				);

				if (rank !== Number(binding.rank)) {
					continue;
				}

				const role = guild.roles.cache.get(binding.discordRoleId);

				if (!role) {
					continue;
				}

				if (
					role.id === guild.id ||
					role.managed ||
					role.position >= guild.members.me.roles.highest.position
				) {
					continue;
				}

				await guild.members.me.roles;

				if (!guild.members.me.permissions.has("ManageRoles")) {
					continue;
				}

				await role.guild.members.cache
					.get(robloxUserId);

				rolesAdded.push({
					role,
					binding,
				});

				if (!selectedPrefix && binding.prefix) {
					selectedPrefix = binding.prefix;
				}
			} catch (error) {
				console.error(
					new Date(),
					"| verification.js |",
					`Error checking group binding ${bindingId}:`,
					error
				);
			}
		}

		return {
			rolesAdded,
			prefix: selectedPrefix,
		};
	}

	async function getRolesForRobloxUser(guild, robloxUserId) {
		const db = admin.database();

		const bindingsRef = db
			.ref("system")
			.child("role_bindings")
			.child(guild.id);

		const snapshot = await bindingsRef.once("value");

		if (!snapshot.exists()) {
			return [];
		}

		const bindings = snapshot.val();
		const matchingRoles = [];

		for (const bindingId of Object.keys(bindings)) {
			const binding = bindings[bindingId];

			if (
				!binding ||
				!binding.groupId ||
				typeof binding.rank !== "number" ||
				!binding.discordRoleId
			) {
				continue;
			}

			try {
				const rank = await noblox.getRankInGroup(
					Number(binding.groupId),
					Number(robloxUserId)
				);

				if (rank !== Number(binding.rank)) {
					continue;
				}

				const role = guild.roles.cache.get(binding.discordRoleId);

				if (!role) {
					continue;
				}

				matchingRoles.push(role);
			} catch (error) {
				console.error(
					new Date(),
					"| verification.js |",
					`Error checking role binding ${bindingId}:`,
					error
				);
			}
		}

		return matchingRoles;
	}

	client.on("interactionCreate", async (interaction) => {
		try {
			if (
				interaction.isButton() &&
				interaction.customId === "verification_channel_start"
			) {
				if (!interaction.guild) {
					return interaction.reply({
						content: "This verification system can only be used in a server.",
						flags: MessageFlags.Ephemeral,
					});
				}

				const db = admin.database();

				const channelRef = db
					.ref("system")
					.child("verification_channels")
					.child(interaction.guild.id);

				const channelSnapshot = await channelRef.once("value");

				if (!channelSnapshot.exists()) {
					return interaction.reply({
						content: "This verification system is not currently bound.",
						flags: MessageFlags.Ephemeral,
					});
				}

				const channelData = channelSnapshot.val();

				if (channelData.channelId !== interaction.channel.id) {
					return interaction.reply({
						content:
							"This verification button is not being used in the bound verification channel.",
						flags: MessageFlags.Ephemeral,
					});
				}

				const userRef = db
					.ref("system")
					.child("user_verification")
					.child(`discord_${interaction.user.id}`);

				const existingSnapshot = await userRef.once("value");
				const existingData = existingSnapshot.exists()
					? existingSnapshot.val()
					: null;

				if (
					existingData &&
					existingData.verified === true &&
					existingData.robloxUsername
				) {
					return interaction.reply({
						content:
							`Your Discord account is already linked to **${existingData.robloxUsername}**.\n\n` +
							`If you need to verify a different Roblox account, use the existing \`/verify\` reverify system.`,
						flags: MessageFlags.Ephemeral,
					});
				}

				const state = crypto.randomBytes(32).toString("hex");

				await userRef.update({
					verificationGuildID: interaction.guild.id,
					verified: false,
					statecode: state,
					discordID: interaction.user.id,
					verificationMethod: null,
					robloxID: null,
					robloxUsername: null,
					robloxDisplayName: null,
					robloxProfile: null,
					verificationCode: null,
					verifiedAt: null,
				});

				const websiteButton = new ButtonBuilder()
					.setLabel("Verify with Website")
					.setStyle(ButtonStyle.Link)
					.setURL(
						`https://auth.trenati.dev/?state=${encodeURIComponent(state)}`
					);

				const descriptionButton = new ButtonBuilder()
					.setCustomId("verification_system_description")
					.setLabel("Verify with User Description")
					.setStyle(ButtonStyle.Secondary);

				return interaction.reply({
					content:
						"Choose how you would like to verify your Roblox account.",
					components: [
						new ActionRowBuilder().addComponents(
							websiteButton,
							descriptionButton
						),
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			if (
				interaction.isButton() &&
				interaction.customId === "verification_system_description"
			) {
				const modal = new ModalBuilder()
					.setCustomId("verification_system_description_modal")
					.setTitle("Roblox Verification");

				const usernameInput = new TextInputBuilder()
					.setCustomId("roblox_username")
					.setLabel("Roblox Username")
					.setPlaceholder("Enter your Roblox username")
					.setStyle(TextInputStyle.Short)
					.setRequired(true);

				modal.addComponents(
					new ActionRowBuilder().addComponents(usernameInput)
				);

				return interaction.showModal(modal);
			}

			if (
				interaction.isModalSubmit() &&
				interaction.customId === "verification_system_description_modal"
			) {
				const username =
					interaction.fields.getTextInputValue("roblox_username").trim();

				await interaction.deferReply({
					flags: MessageFlags.Ephemeral,
				});

				let robloxUserId;

				try {
					robloxUserId = await noblox.getIdFromUsername(username);
				} catch (error) {
					return interaction.editReply({
						content:
							`I could not find a Roblox account with the username **${username}**.`,
					});
				}

				if (!robloxUserId) {
					return interaction.editReply({
						content:
							`I could not find a Roblox account with the username **${username}**.`,
					});
				}

				let robloxUser;

				try {
					robloxUser = await noblox.getPlayerInfo(robloxUserId);
				} catch (error) {
					return interaction.editReply({
						content:
							"I could not retrieve information about that Roblox account.",
					});
				}

				const code =
					`VER-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

				const db = admin.database();

				const userRef = db
					.ref("system")
					.child("user_verification")
					.child(`discord_${interaction.user.id}`);

				const currentSnapshot = await userRef.once("value");
				const currentData = currentSnapshot.exists()
					? currentSnapshot.val()
					: {};

				await userRef.update({
					verificationGuildID:
						currentData.verificationGuildID || interaction.guild?.id,
					verified: false,
					discordID: interaction.user.id,
					verificationMethod: "description",
					robloxID: Number(robloxUserId),
					robloxUsername: robloxUser.username,
					robloxDisplayName: robloxUser.displayName,
					robloxProfile:
						`https://www.roblox.com/users/${robloxUserId}/profile`,
					verificationCode: code,
					statecode: currentData.statecode || null,
					verifiedAt: null,
				});

				const avatar = await fetchAvatar(robloxUserId);

				const embed = new EmbedBuilder()
					.setTitle("Roblox Verification")
					.setDescription(
						`To verify ownership of **${robloxUser.username}**, put the following code somewhere in your Roblox profile description:\n\n` +
						`**${code}**\n\n` +
						`After adding the code, click **Confirm Verification** below.`
					)
					.addFields({
						name: "Roblox Profile",
						value:
							`[${robloxUser.username}](https://www.roblox.com/users/${robloxUserId}/profile)`,
					})
					.setTimestamp();

				if (avatar) {
					embed.setThumbnail(avatar);
				}

				const confirmButton = new ButtonBuilder()
					.setCustomId("verification_system_confirm")
					.setLabel("Confirm Verification")
					.setStyle(ButtonStyle.Success);

				return interaction.editReply({
					embeds: [embed],
					components: [
						new ActionRowBuilder().addComponents(confirmButton),
					],
				});
			}

			if (
				interaction.isButton() &&
				interaction.customId === "verification_system_confirm"
			) {
				await interaction.deferReply({
					flags: MessageFlags.Ephemeral,
				});

				if (!interaction.guild) {
					return interaction.editReply({
						content:
							"This verification system can only be used in a server.",
					});
				}

				const db = admin.database();

				const userRef = db
					.ref("system")
					.child("user_verification")
					.child(`discord_${interaction.user.id}`);

				const snapshot = await userRef.once("value");

				if (!snapshot.exists()) {
					return interaction.editReply({
						content:
							"No verification session was found. Please start verification again.",
					});
				}

				const data = snapshot.val();

				if (!data.robloxID || !data.verificationCode) {
					return interaction.editReply({
						content:
							"No active Roblox description verification was found.",
					});
				}

				let blurb;

				try {
					blurb = await noblox.getBlurb(Number(data.robloxID));
				} catch (error) {
					return interaction.editReply({
						content:
							"I could not retrieve the Roblox profile description right now. Please try again.",
					});
				}

				if (
					typeof blurb !== "string" ||
					!blurb.includes(data.verificationCode)
				) {
					return interaction.editReply({
						content:
							`I could not find **${data.verificationCode}** in your Roblox profile description.\n\n` +
							`Add the code to your profile description and try again.`,
					});
				}

				const member = await interaction.guild.members
					.fetch(interaction.user.id)
					.catch(() => null);

				if (!member) {
					return interaction.editReply({
						content:
							"I could not find your Discord member information.",
					});
				}

				if (
					!interaction.guild.members.me.permissions.has("ManageRoles")
				) {
					return interaction.editReply({
						content:
							"I need the Manage Roles permission to complete verification.",
					});
				}

				const roles = await getRolesForRobloxUser(
					interaction.guild,
					Number(data.robloxID)
				);

				const addedRoles = [];

				for (const role of roles) {
					if (
						role.id === interaction.guild.id ||
						role.managed ||
						role.position >=
							interaction.guild.members.me.roles.highest.position
					) {
						continue;
					}

					try {
						await member.roles.add(role);
						addedRoles.push(role);
					} catch (error) {
						console.error(
							new Date(),
							"| verification.js |",
							`Failed to add role ${role.name}:`,
							error
						);
					}
				}

				let nickname = data.robloxUsername;

				try {
					await member.setNickname(nickname);
				} catch (error) {
					console.error(
						new Date(),
						"| verification.js |",
						"Failed to update nickname:",
						error
					);
				}

				await userRef.update({
					verified: true,
					verificationMethod: "description",
					robloxID: Number(data.robloxID),
					robloxUsername: data.robloxUsername,
					robloxDisplayName: data.robloxDisplayName,
					robloxProfile: data.robloxProfile,
					verificationCode: null,
					statecode: null,
					verifiedAt: Date.now(),
				});

				const roleText =
					addedRoles.length > 0
						? addedRoles.map(role => `<@&${role.id}>`).join(", ")
						: "No matching roles found.";

				const successEmbed = new EmbedBuilder()
					.setTitle("Verification Complete")
					.setDescription(
						`Your Roblox account **${data.robloxUsername}** has been successfully verified.`
					)
					.addFields(
						{
							name: "Roblox Account",
							value:
								`[${data.robloxUsername}](${data.robloxProfile})`,
						},
						{
							name: "Roles",
							value: roleText,
						}
					)
					.setTimestamp();

				return interaction.editReply({
					embeds: [successEmbed],
					components: [],
				});
			}
		} catch (error) {
			console.error(
				new Date(),
				"| verification.js |",
				"Verification interaction error:",
				error
			);

			if (!interaction.replied && !interaction.deferred) {
				return interaction.reply({
					content:
						"An unexpected error occurred while processing verification.",
					flags: MessageFlags.Ephemeral,
				});
			}

			if (interaction.deferred) {
				return interaction.editReply({
					content:
						"An unexpected error occurred while processing verification.",
				});
			}
		}
	});
};