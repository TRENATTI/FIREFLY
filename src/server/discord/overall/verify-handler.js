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

const {
	getRoleBindings
} = require("../../../util/cache.js");

const {
	logUpdateVerify
} = require("../../../util/verify-logger.js");


module.exports = function (
	client,
	noblox,
	currentUser,
	admin,
	token,
	applicationid,
	prefix
) {

	// =========================================================
	// ROBLOX AVATAR
	// =========================================================

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

							const json =
								JSON.parse(data);

							if (
								json.data &&
								json.data[0] &&
								json.data[0].imageUrl
							) {

								return resolve(
									json.data[0].imageUrl
								);

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


	// =========================================================
	// SYNCHRONIZE ROLES
	// =========================================================

	async function synchronizeRoles(
		guild,
		member,
		robloxUserId
	) {

		const bindings =
			await getRoleBindings(
				admin,
				guild.id
			);

		const rolesToAdd = [];
		const rolesToRemove = [];

		// =====================================================
		// BOT MEMBER
		// =====================================================

		const botMember =
			guild.members.me;

		if (!botMember) {

			throw new Error(
				"Could not find the bot member in this guild."
			);

		}

		// =====================================================
		// MANAGE ROLES
		// =====================================================

		if (
			!botMember.permissions.has("ManageRoles")
		) {

			throw new Error(
				"I need the Manage Roles permission to update verification roles."
			);

		}

		const botHighestRole =
			botMember.roles.highest;


		// =====================================================
		// VERIFIED ROLE
		// =====================================================

		let verifiedRole =
			guild.roles.cache.find(
				role =>
					role.name === "Verified"
			);


		// =====================================================
		// CREATE VERIFIED ROLE
		// =====================================================

		if (!verifiedRole) {

			try {

				verifiedRole =
					await guild.roles.create({

						name:
							"Verified",

						reason:
							"Created automatically by the verification system."

					});

			} catch (error) {

				console.warn(
					"Could not create Verified role:",
					error
				);

				verifiedRole =
					null;

			}

		}


		// =====================================================
		// ADD VERIFIED ROLE
		// =====================================================

		if (verifiedRole) {

			if (
				!verifiedRole.managed &&
				verifiedRole.position <
					botHighestRole.position
			) {

				if (
					!member.roles.cache.has(
						verifiedRole.id
					)
				) {

					rolesToAdd.push(
						verifiedRole
					);

				}

			} else {

				console.warn(

					`Cannot manage Verified role "${verifiedRole.name}". ` +
					`Role position: ${verifiedRole.position}, ` +
					`Bot highest role position: ${botHighestRole.position}.`

				);

			}

		}


		// =====================================================
		// ROBLOX RANK CACHE
		// =====================================================

		const rankCache =
			new Map();


		// =====================================================
		// PROCESS ROLE BINDINGS
		// =====================================================

		for (
			const [
				bindingId,
				binding
			]
			of Object.entries(
				bindings || {}
			)
		) {

			try {

				// =================================================
				// VALIDATE
				// =================================================

				if (
					!binding ||
					!binding.groupId ||
					!binding.discordRoleId
				) {

					continue;

				}


				const groupId =
					Number(
						binding.groupId
					);

				const discordRoleId =
					String(
						binding.discordRoleId
					);


				// =================================================
				// GET DISCORD ROLE
				// =================================================

				const discordRole =
					guild.roles.cache.get(
						discordRoleId
					);


				if (!discordRole) {

					console.warn(
						`Discord role ${discordRoleId} no longer exists.`
					);

					continue;

				}


				// =================================================
				// CHECK ROLE HIERARCHY
				// =================================================

				if (
					discordRole.managed ||
					discordRole.position >=
						botHighestRole.position
				) {

					console.warn(

						`Cannot manage role "${discordRole.name}" (${discordRole.id}). ` +
						`Role position: ${discordRole.position}, ` +
						`Bot highest role position: ${botHighestRole.position}.`

					);

					continue;

				}


				// =================================================
				// GET ROBLOX RANK
				// =================================================

				let userRank;

				if (
					rankCache.has(
						groupId
					)
				) {

					userRank =
						rankCache.get(
							groupId
						);

				} else {

					userRank =
						await noblox.getRankInGroup(

							groupId,

							Number(
								robloxUserId
							)

						);

					rankCache.set(
						groupId,
						userRank
					);

				}


				// =================================================
				// ENTIRE GROUP
				// =================================================

				if (
					binding.entireGroup === true
				) {

					// =============================================
					// USER IS IN GROUP
					// =============================================

					if (
						userRank > 0
					) {

						if (
							!member.roles.cache.has(
								discordRoleId
							)
						) {

							rolesToAdd.push(
								discordRole
							);

						}

					}

					// =============================================
					// USER IS NOT IN GROUP
					// =============================================

					else {

						if (
							member.roles.cache.has(
								discordRoleId
							)
						) {

							rolesToRemove.push(
								discordRole
							);

						}

					}

					continue;

				}


				// =================================================
				// RANK-SPECIFIC BINDING
				// =================================================

				if (
					binding.rank === undefined ||
					binding.rank === null
				) {

					console.warn(

						`Binding ${bindingId} has no rank ` +
						`and is not marked as an entire-group binding.`

					);

					continue;

				}


				const requiredRank =
					Number(
						binding.rank
					);


				// =================================================
				// RANK MATCHES
				// =================================================

				if (
					userRank ===
					requiredRank
				) {

					if (
						!member.roles.cache.has(
							discordRoleId
						)
					) {

						rolesToAdd.push(
							discordRole
						);

					}

				}


				// =================================================
				// RANK DOES NOT MATCH
				// =================================================

				else {

					const userLeftGroup =
						userRank === 0;

					const shouldRemove =
						userLeftGroup ||
						binding.removeOnLeave === true;

					if (
						shouldRemove &&
						member.roles.cache.has(
							discordRoleId
						)
					) {

						rolesToRemove.push(
							discordRole
						);

					}

				}

			} catch (error) {

				console.warn(

					`Failed to process binding ${bindingId}:`,

					error

				);

			}

		}


		// =====================================================
		// REMOVE DUPLICATE ADDITIONS
		// =====================================================

		const uniqueRolesToAdd =
			[
				...new Map(
					rolesToAdd.map(
						role => [
							role.id,
							role
						]
					)
				).values()
			];


		// =====================================================
		// REMOVE DUPLICATE REMOVALS
		// =====================================================

		const uniqueRolesToRemove =
			[
				...new Map(
					rolesToRemove.map(
						role => [
							role.id,
							role
						]
					)
				).values()
			];


		// =====================================================
		// ADD ROLES
		// =====================================================

		const addedRoles = [];

		for (
			const role
			of uniqueRolesToAdd
		) {

			try {

				if (
					role.managed ||
					role.position >=
						botHighestRole.position
				) {

					console.warn(

						`Cannot add role "${role.name}". ` +
						`It is not below the bot's highest role.`

					);

					continue;

				}


				if (
					!member.roles.cache.has(
						role.id
					)
				) {

					await member.roles.add(

						role,

						"Roblox verification role synchronization."

					);

					addedRoles.push(
						role
					);

				}

			} catch (error) {

				console.warn(

					`Failed to add role ${role.name}:`,

					error

				);

			}

		}


		// =====================================================
		// REMOVE ROLES
		// =====================================================

		const removedRoles = [];

		for (
			const role
			of uniqueRolesToRemove
		) {

			try {

				if (
					role.managed ||
					role.position >=
						botHighestRole.position
				) {

					console.warn(

						`Cannot remove role "${role.name}". ` +
						`It is not below the bot's highest role.`

					);

					continue;

				}


				if (
					member.roles.cache.has(
						role.id
					)
				) {

					await member.roles.remove(

						role,

						"Roblox verification role synchronization."

					);

					removedRoles.push(
						role
					);

				}

			} catch (error) {

				console.warn(

					`Failed to remove role ${role.name}:`,

					error

				);

			}

		}


		return {

			addedRoles,
			removedRoles

		};

	}


	// =========================================================
	// INTERACTION HANDLER
	// =========================================================

	client.on(
		"interactionCreate",
		async (interaction) => {

			try {

				// =================================================
				// START VERIFICATION
				// =================================================

				if (
					interaction.isButton() &&
					interaction.customId ===
						"verification_channel_start"
				) {

					if (!interaction.guild) {

						return interaction.reply({

							content:
								"This verification system can only be used in a server.",

							flags:
								MessageFlags.Ephemeral,

						});

					}


					const db =
						admin.database();


					// =================================================
					// CHECK VERIFICATION CHANNEL
					// =================================================

					const channelRef =
						db
							.ref("system")
							.child("verification_channels")
							.child(
								interaction.guild.id
							);


					const channelSnapshot =
						await channelRef.once(
							"value"
						);


					if (
						!channelSnapshot.exists()
					) {

						return interaction.reply({

							content:
								"This verification system is not currently bound.",

							flags:
								MessageFlags.Ephemeral,

						});

					}


					const channelData =
						channelSnapshot.val();


					if (
						channelData.channelId !==
						interaction.channel.id
					) {

						return interaction.reply({

							content:
								"This verification button is not being used in the bound verification channel.",

							flags:
								MessageFlags.Ephemeral,

						});

					}


					// =================================================
					// GET VERIFICATION DATA
					// =================================================

					const userRef =
						db
							.ref("system")
							.child("user_verification")
							.child(
								`discord_${interaction.user.id}`
							);


					const existingSnapshot =
						await userRef.once(
							"value"
						);


					const existingData =
						existingSnapshot.exists()
							? existingSnapshot.val()
							: null;


					// =================================================
					// ALREADY VERIFIED
					// =================================================

					if (
						existingData &&
						existingData.verified === true &&
						existingData.robloxUsername &&
						existingData.robloxID
					) {

						// =================================================
						// DEFER IMMEDIATELY
						// =================================================

						await interaction.deferReply({

							flags:
								MessageFlags.Ephemeral,

						});


						// =================================================
						// GET MEMBER
						// =================================================

						const member =
							await interaction.guild.members
								.fetch(
									interaction.user.id
								)
								.catch(
									() => null
								);


						if (!member) {

							return interaction.editReply({

								content:
									"I could not find your Discord member information.",

							});

						}


						// =================================================
						// BOT MEMBER
						// =================================================

						const botMember =
							interaction.guild.members.me;


						// =================================================
						// CHECK MANAGE ROLES
						// =================================================

						if (
							!botMember ||
							!botMember.permissions.has(
								"ManageRoles"
							)
						) {

							return interaction.editReply({

								content:
									"I need the **Manage Roles** permission to synchronize your verification roles.",

							});

						}


						// =================================================
						// SYNCHRONIZE ROLES
						// =================================================

						let addedRoles = [];
						let removedRoles = [];


						try {

							const result =
								await synchronizeRoles(

									interaction.guild,

									member,

									Number(
										existingData.robloxID
									)

								);


							addedRoles =
								result.addedRoles;

							removedRoles =
								result.removedRoles;

						} catch (error) {

							console.warn(

								new Date(),
								"| verification.js |",
								"Failed to synchronize roles for already verified user:",
								error

							);


							return interaction.editReply({

								content:
									"I could not synchronize your Discord roles. Please make sure the bot has **Manage Roles** and that its highest role is above the roles it needs to manage.",

							});

						}


						// =================================================
						// SYNCHRONIZE NICKNAME
						// =================================================

						let nicknameUpdated =
							false;


						const canManageNickname =
							botMember &&
							botMember.permissions.has(
								"ManageNicknames"
							) &&
							member.id !==
								interaction.guild.ownerId &&
							member.id !==
								botMember.id &&
							member.manageable;


						if (
							canManageNickname
						) {

							try {

								if (
									member.nickname !==
									existingData.robloxUsername
								) {

									await member.setNickname(

										existingData.robloxUsername,

										"Roblox verification synchronization."

									);

									nicknameUpdated =
										true;

								}

							} catch (error) {

								console.warn(

									new Date(),
									"| verification.js |",
									"Failed to update nickname for already verified user:",
									error

								);

							}

						} else {

							console.warn(

								new Date(),
								"| verification.js |",
								`Cannot update nickname for ${member.user.tag}: member is not manageable by the bot.`

							);

						}


						// =================================================
						// LOG UPDATE
						// =================================================

						try {

							await logUpdateVerify(

								interaction.client,

								admin,

								{

									guildId:
										interaction.guild.id,

									type:
										"update",

									discordUser:
										interaction.user.id,

									robloxUsername:
										existingData.robloxUsername,

									robloxId:
										existingData.robloxID,

									nicknameChanged:
										nicknameUpdated,

									rolesAdded:
										addedRoles.map(
											role =>
												role.id
										),

									rolesRemoved:
										removedRoles.map(
											role =>
												role.id
										),

								}

							);

						} catch (loggerError) {

							console.warn(
								"Failed to log role synchronization:",
								loggerError
							);

						}


						// =================================================
						// ROLE CHANGES
						// =================================================

						const roleChanges = [];


						if (
							addedRoles.length > 0
						) {

							roleChanges.push(

								`**Roles Added:** ${addedRoles
									.map(
										role =>
											`<@&${role.id}>`
									)
									.join(", ")}`

							);

						}


						if (
							removedRoles.length > 0
						) {

							roleChanges.push(

								`**Roles Removed:** ${removedRoles
									.map(
										role =>
											`<@&${role.id}>`
									)
									.join(", ")}`

							);

						}


						if (
							roleChanges.length === 0
						) {

							roleChanges.push(
								"No role changes were required."
							);

						}


						// =================================================
						// NICKNAME RESULT
						// =================================================

						if (
							nicknameUpdated
						) {

							roleChanges.push(
								"**Nickname:** Updated"
							);
						}


						// =================================================
						// FINAL RESPONSE
						// =================================================

						return interaction.editReply({

							content:

								`Your Discord account is already linked to **${existingData.robloxUsername}**.\n\n` +

								`Your verification synchronization has been completed.` +

								`\n\n${roleChanges.join("\n")}` +

								`\n\nIf you need to verify a different Roblox account, use the existing \`/verify reverify\` system.`,

						});

					}


					// =================================================
					// NEW VERIFICATION STATE
					// =================================================

					const state =
						crypto
							.randomBytes(32)
							.toString("hex");


					await userRef.update({

						verificationGuildID:
							interaction.guild.id,

						verified:
							false,

						statecode:
							state,

						discordID:
							interaction.user.id,

						verificationMethod:
							null,

						robloxID:
							null,

						robloxUsername:
							null,

						robloxDisplayName:
							null,

						robloxProfile:
							null,

						verificationCode:
							null,

						verifiedAt:
							null,

					});


					// =================================================
					// WEBSITE BUTTON
					// =================================================

					const websiteButton =
						new ButtonBuilder()

							.setLabel(
								"Verify with Website"
							)

							.setStyle(
								ButtonStyle.Link
							)

							.setURL(

								`https://auth.trenati.dev/?state=${encodeURIComponent(state)}`

							);


					// =================================================
					// DESCRIPTION BUTTON
					// =================================================

					const descriptionButton =
						new ButtonBuilder()

							.setCustomId(
								"verification_system_description"
							)

							.setLabel(
								"Verify with User Description"
							)

							.setStyle(
								ButtonStyle.Secondary
							);


					return interaction.reply({

						content:
							"Choose how you would like to verify your Roblox account.",

						components:

							[

								new ActionRowBuilder()
									.addComponents(

										websiteButton,

										descriptionButton

									),

							],

						flags:
							MessageFlags.Ephemeral,

					});

				}


				// =================================================
				// DESCRIPTION VERIFICATION BUTTON
				// =================================================

				if (
					interaction.isButton() &&
					interaction.customId ===
						"verification_system_description"
				) {

					const modal =
						new ModalBuilder()

							.setCustomId(
								"verification_system_description_modal"
							)

							.setTitle(
								"Roblox Verification"
							);


					const usernameInput =
						new TextInputBuilder()

							.setCustomId(
								"roblox_username"
							)

							.setLabel(
								"Roblox Username"
							)

							.setPlaceholder(
								"Enter your Roblox username"
							)

							.setStyle(
								TextInputStyle.Short
							)

							.setRequired(
								true
							);


					modal.addComponents(

						new ActionRowBuilder()
							.addComponents(
								usernameInput
							)

					);


					return interaction.showModal(
						modal
					);

				}


				// =================================================
				// DESCRIPTION VERIFICATION MODAL
				// =================================================

				if (
					interaction.isModalSubmit() &&
					interaction.customId ===
						"verification_system_description_modal"
				) {

					const username =
						interaction
							.fields
							.getTextInputValue(
								"roblox_username"
							)
							.trim();


					await interaction.deferReply({

						flags:
							MessageFlags.Ephemeral,

					});


					// =================================================
					// GET ROBLOX USER ID
					// =================================================

					let robloxUserId;


					try {

						robloxUserId =
							await noblox.getIdFromUsername(
								username
							);

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


					// =================================================
					// GET ROBLOX PLAYER INFO
					// =================================================

					let robloxUser;


					try {

						robloxUser =
							await noblox.getPlayerInfo(
								robloxUserId
							);

					} catch (error) {

						return interaction.editReply({

							content:
								"I could not retrieve information about that Roblox account.",

						});

					}


					// =================================================
					// CREATE DESCRIPTION CODE
					// =================================================

					const code =
						`VER-${crypto
							.randomBytes(2)
							.toString("hex")
							.toUpperCase()}`;


					const db =
						admin.database();


					const userRef =
						db
							.ref("system")
							.child("user_verification")
							.child(
								`discord_${interaction.user.id}`
							);


					const currentSnapshot =
						await userRef.once(
							"value"
						);


					const currentData =
						currentSnapshot.exists()
							? currentSnapshot.val()
							: {};


					await userRef.update({

						verificationGuildID:
							currentData.verificationGuildID ||
							interaction.guild?.id,

						verified:
							false,

						discordID:
							interaction.user.id,

						verificationMethod:
							"description",

						robloxID:
							Number(
								robloxUserId
							),

						robloxUsername:
							robloxUser.username,

						robloxDisplayName:
							robloxUser.displayName,

						robloxProfile:
							`https://www.roblox.com/users/${robloxUserId}/profile`,

						verificationCode:
							code,

						statecode:
							currentData.statecode ||
							null,

						verifiedAt:
							null,

					});


					// =================================================
					// GET AVATAR
					// =================================================

					const avatar =
						await fetchAvatar(
							robloxUserId
						);


					// =================================================
					// VERIFICATION EMBED
					// =================================================

					const embed =
						new EmbedBuilder()

							.setTitle(
								"Roblox Verification"
							)

							.setDescription(

								`To verify that **${robloxUser.username}** is your Roblox account:\n\n` +

								`1. Visit [**your profile**](https://www.roblox.com/users/${robloxUserId}/profile)\n` +

								`2. Add this code to your **About Me**:\n` +

								`\`\`\`${code}\`\`\`\n` +

								`3. Click **Confirm** below once you've done it.`

							)

							.addFields({

								name:
									"Roblox Profile",

								value:
									`[${robloxUser.username}](https://www.roblox.com/users/${robloxUserId}/profile)`,

							})

							.setTimestamp();


					if (avatar) {

						embed.setThumbnail(
							avatar
						);

					}


					// =================================================
					// CONFIRM BUTTON
					// =================================================

					const confirmButton =
						new ButtonBuilder()

							.setCustomId(
								"verification_system_confirm"
							)

							.setLabel(
								"Confirm Verification"
							)

							.setStyle(
								ButtonStyle.Success
							);


					return interaction.editReply({

						embeds:
							[embed],

						components:

							[

								new ActionRowBuilder()
									.addComponents(
										confirmButton
									)

							],

					});

				}


				// =================================================
				// CONFIRM DESCRIPTION VERIFICATION
				// =================================================

				if (
					interaction.isButton() &&
					interaction.customId ===
						"verification_system_confirm"
				) {

					await interaction.deferReply({

						flags:
							MessageFlags.Ephemeral,

					});


					// =================================================
					// CHECK GUILD
					// =================================================

					if (!interaction.guild) {

						return interaction.editReply({

							content:
								"This verification system can only be used in a server.",

						});

					}


					const db =
						admin.database();


					// =================================================
					// GET VERIFICATION DATA
					// =================================================

					const userRef =
						db
							.ref("system")
							.child("user_verification")
							.child(
								`discord_${interaction.user.id}`
							);


					const snapshot =
						await userRef.once(
							"value"
						);


					if (
						!snapshot.exists()
					) {

						return interaction.editReply({

							content:
								"No verification session was found. Please start verification again.",

						});

					}


					const data =
						snapshot.val();


					if (
						!data.robloxID ||
						!data.verificationCode
					) {

						return interaction.editReply({

							content:
								"No active Roblox description verification was found.",

						});

					}


					// =================================================
					// CHECK ROBLOX DESCRIPTION
					// =================================================

					let blurb;


					try {

						blurb =
							await noblox.getBlurb(
								Number(
									data.robloxID
								)
							);

					} catch (error) {

						return interaction.editReply({

							content:
								"I could not retrieve the Roblox profile description right now. Please try again.",

						});

					}


					if (
						typeof blurb !== "string" ||
						!blurb.includes(
							data.verificationCode
						)
					) {

						return interaction.editReply({

							content:

								`I could not find **${data.verificationCode}** in your Roblox profile description.\n\n` +

								`Add the code to your profile description and try again.`,

						});

					}


					// =================================================
					// GET DISCORD MEMBER
					// =================================================

					const member =
						await interaction.guild.members
							.fetch(
								interaction.user.id
							)
							.catch(
								() => null
							);


					if (!member) {

						return interaction.editReply({

							content:
								"I could not find your Discord member information.",

						});

					}


					// =================================================
					// BOT MEMBER
					// =================================================

					const botMember =
						interaction.guild.members.me;


					// =================================================
					// CHECK MANAGE ROLES
					// =================================================

					if (
						!botMember ||
						!botMember.permissions.has(
							"ManageRoles"
						)
					) {

						return interaction.editReply({

							content:
								"I need the **Manage Roles** permission to complete verification.",

						});

					}


					// =================================================
					// SYNCHRONIZE ROLES
					// =================================================

					let addedRoles = [];
					let removedRoles = [];


					try {

						const result =
							await synchronizeRoles(

								interaction.guild,

								member,

								Number(
									data.robloxID
								)

							);


						addedRoles =
							result.addedRoles;

						removedRoles =
							result.removedRoles;

					} catch (error) {

						console.warn(

							new Date(),
							"| verification.js |",
							"Failed to synchronize verification roles:",
							error

						);


						return interaction.editReply({

							content:
								"I could not synchronize your Discord roles. Please make sure the bot has **Manage Roles** and its highest role is above the roles it needs to manage.",

						});

					}


					// =================================================
					// UPDATE NICKNAME
					// =================================================

					let nicknameUpdated =
						false;


					const canManageNickname =
						botMember &&
						botMember.permissions.has(
							"ManageNicknames"
						) &&
						member.id !==
							interaction.guild.ownerId &&
						member.id !==
							botMember.id &&
						member.manageable;


					if (
						canManageNickname
					) {

						try {

							if (
								member.nickname !==
								data.robloxUsername
							) {

								await member.setNickname(

									data.robloxUsername,

									"Roblox verification."

								);

								nicknameUpdated =
									true;

							}

						} catch (error) {

							console.warn(

								new Date(),
								"| verification.js |",
								"Failed to update nickname:",
								error

							);

						}

					} else {

						console.warn(

							new Date(),
							"| verification.js |",
							`Cannot update nickname for ${member.user.tag}: member is not manageable by the bot.`

						);

					}


					// =================================================
					// MARK VERIFIED
					// =================================================

					await userRef.update({

						verified:
							true,

						verificationMethod:
							"description",

						robloxID:
							Number(
								data.robloxID
							),

						robloxUsername:
							data.robloxUsername,

						robloxDisplayName:
							data.robloxDisplayName,

						robloxProfile:
							data.robloxProfile,

						verificationCode:
							null,

						statecode:
							null,

						verifiedAt:
							Date.now(),

					});


					// =================================================
					// LOG UPDATE
					// =================================================

					try {

						await logUpdateVerify(

							interaction.client,

							admin,

							{

								guildId:
									interaction.guild.id,

								type:
									"update",

								discordUser:
									interaction.user.id,

								robloxUsername:
									data.robloxUsername,

								robloxId:
									data.robloxID,

								nicknameChanged:
									nicknameUpdated,

								rolesAdded:
									addedRoles.map(
										role =>
											role.id
									),

								rolesRemoved:
									removedRoles.map(
										role =>
											role.id
									),

							}

						);

					} catch (loggerError) {

						console.warn(
							"Failed to log verification update:",
							loggerError
						);

					}


					// =================================================
					// ROLE RESPONSE
					// =================================================

					const roleChanges = [];


					if (
						addedRoles.length > 0
					) {

						roleChanges.push(

							`**Roles Added:** ${addedRoles
								.map(
									role =>
										`<@&${role.id}>`
								)
								.join(", ")}`

						);

					}


					if (
						removedRoles.length > 0
					) {

						roleChanges.push(

							`**Roles Removed:** ${removedRoles
								.map(
									role =>
										`<@&${role.id}>`
								)
								.join(", ")}`

						);

					}


					if (
						roleChanges.length === 0
					) {

						roleChanges.push(
							"No role changes were required."
						);

					}


					// =================================================
					// NICKNAME RESPONSE
					// =================================================

					if (
						nicknameUpdated
					) {

						roleChanges.push(
							"**Nickname:** Updated"
						);

					} else {

						roleChanges.push(
							"**Nickname:** Could not be updated due to Discord permissions."
						);

					}


					// =================================================
					// SUCCESS EMBED
					// =================================================

					const successEmbed =
						new EmbedBuilder()

							.setTitle(
								"Verification Complete"
							)

							.setDescription(

								`Your Roblox account **${data.robloxUsername}** has been successfully verified.`

							)

							.addFields(

								{

									name:
										"Roblox Account",

									value:
										`[${data.robloxUsername}](${data.robloxProfile})`,

								},

								{

									name:
										"Roles",

									value:
										roleChanges.join("\n"),

								}

							)

							.setTimestamp();


					return interaction.editReply({

						embeds:
							[successEmbed],

						components:
							[],

					});

				}

			} catch (error) {

				console.warn(

					new Date(),
					"| verification.js |",
					"Verification interaction error:",
					error

				);


				// =================================================
				// SAFE INTERACTION ERROR RESPONSE
				// =================================================

				if (
					interaction.deferred ||
					interaction.replied
				) {

					try {

						return await interaction.editReply({

							content:
								"An unexpected error occurred while processing verification.",

							embeds:
								[],

							components:
								[],

						});

					} catch (editError) {

						console.warn(

							new Date(),
							"| verification.js |",
							"Failed to send deferred interaction error:",
							editError

						);

					}

					return;

				}


				try {

					return await interaction.reply({

						content:
							"An unexpected error occurred while processing verification.",

						flags:
							MessageFlags.Ephemeral,

					});

				} catch (replyError) {

					console.warn(

						new Date(),
						"| verification.js |",
						"Failed to send interaction error:",
						replyError

					);

				}

			}

		}
	);

};