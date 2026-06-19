const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require("discord.js");
const noblox = require("noblox.js");
const crypto = require("crypto");
const https = require("https");

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const db = (...args) => import("../../database-services/db.js").then(({ exec }) => exec(...args));
//import * as db from "../db.js";
const groupRoleMap = require("../../verify-services/groupRoleMap");

function fetchAvatar(userId) {
	return new Promise((resolve) => {
		const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
		https
			.get(url, (res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
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
			.on("error", () => resolve(null));
	});
}

async function checkRoVer(discordId, guildId) {
	if (!process.env.ROVER_API_KEY) return null;
	try {
		const res = await fetch(`https://registry.rover.link/api/guilds/${guildId}/discord-to-roblox/${discordId}`, {
			headers: {
				Authorization: "Bearer " + process.env.ROVER_API_KEY,
				"User-Agent": "DiscordBot (1INFM, v1.0)",
				Accept: "application/json",
			},
		});
		if (!res.ok) return null;
		const data = await res.json();
		if (data?.robloxId && data?.cachedUsername) {
			return {
				robloxId: data.robloxId,
				robloxUsername: data.cachedUsername,
				source: "RoVer",
			};
		}
	} catch {
		return null;
	}
	return null;
}

async function assignRolesForUser(interaction, guildId, robloxId, robloxUsername) {
	const guildGroupMap = groupRoleMap[guildId];
	if (!guildGroupMap) return robloxUsername;
	let chosenPrefix = "";
	for (const [groupId, rankToRoles] of Object.entries(guildGroupMap)) {
		try {
			const rank = await noblox.getRankInGroup(Number(groupId), robloxId);
			const roleEntries = rankToRoles[rank];
			if (Array.isArray(roleEntries)) {
				for (const entry of roleEntries) {
					const role = interaction.guild.roles.cache.get(entry.id);
					if (role && !interaction.member.roles.cache.has(role.id)) {
						await interaction.member.roles.add(role).catch(() => {});
					}
					if (entry.prefix && !chosenPrefix) chosenPrefix = entry.prefix;
				}
			}
		} catch {}
	}
	return chosenPrefix + robloxUsername;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verify")
		.setDescription("Link your Roblox account")
		.addStringOption((option) => option.setName("username").setDescription("Your Roblox username (optional if found in RoVer)").setRequired(false)),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: false });

		const discordId = interaction.user.id;
		const guildId = interaction.guild.id;

		// Already linked check
		/*const existing = db
      .prepare(`SELECT * FROM linked_accounts WHERE discord_id = ?`)
      .get(discordId);*/
		const linkedrows = await db(
			`SELECT *
        FROM linked_accounts
        WHERE discord_id = ?`,
			[discordId],
		);

		const existing = linkedrows[0] || null;
		if (existing) {
			return interaction.editReply({
				content: `You’ve already linked your Discord account to **${existing.roblox_username}**.`,
			});
		}

		// Get provided username
		const username = interaction.options.getString("username");

		// === If no username, try RoVer ===
		if (!username) {
			const linked = await checkRoVer(discordId, guildId);
			if (linked) {
				/*db.prepare(
          `INSERT OR REPLACE INTO linked_accounts (discord_id, roblox_id, roblox_username)
           VALUES (?, ?, ?)`
        ).run(discordId, linked.robloxId, linked.robloxUsername);*/
				await db(
					`
          INSERT INTO linked_accounts (discord_id, roblox_id, roblox_username)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            roblox_id = VALUES(roblox_id),
            roblox_username = VALUES(roblox_username)
          `,
					[discordId, linked.robloxId, linked.robloxUsername],
				);

				const finalNickname = await assignRolesForUser(interaction, guildId, linked.robloxId, linked.robloxUsername);
				await interaction.member.setNickname(finalNickname).catch(() => {});
				const avatarUrl = await fetchAvatar(linked.robloxId);

				const successEmbed = new EmbedBuilder()
					.setTitle("Verification Successful")
					.setColor("DarkBlue")
					.setDescription(`We found your existing linked account on **${linked.source}** and linked you automatically.\nRoblox: **${linked.robloxUsername}**`)
					.setThumbnail(avatarUrl)
					.setFooter({
						iconURL: "https://i.imgur.com/ItXLkbh.png",
						text: `1IC Automated Systems`,
					})
					.setTimestamp();

				return interaction.editReply({ embeds: [successEmbed] });
			}

			// No username and not found in RoVer
			return interaction.editReply({
				content: "You must provide a Roblox username if you're not in RoVer.",
			});
		}

		// === Manual verification if username provided ===
		let userId;
		try {
			userId = await noblox.getIdFromUsername(username);
		} catch {
			return interaction.editReply({
				content: `Could not find Roblox user **"${username}"**.`,
			});
		}

		const code = `VER-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
		/*db.prepare(
      `INSERT OR REPLACE INTO verifications (discord_id, roblox_id, roblox_username, code)
       VALUES (?, ?, ?, ?)`
    ).run(discordId, userId, username, code);*/
		await db(
			`
      INSERT INTO verifications (discord_id, roblox_id, roblox_username, code)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        roblox_id = VALUES(roblox_id),
        roblox_username = VALUES(roblox_username),
        code = VALUES(code)
      `,
			[discordId, userId, username, code],
		);

		const avatarUrl = await fetchAvatar(userId);

		const verifyEmbed = new EmbedBuilder()
			.setTitle("Verification Process")
			.setColor("DarkBlue")
			.setDescription(`To verify that **${username}** is your Roblox account:\n\n` + `1. Visit [**your profile**](https://www.roblox.com/users/${userId}/profile)\n` + `2. Add this code to your **About Me**:\n\`\`\`${code}\`\`\`\n` + `3. Click **Confirm** below once you've done it.`)
			.setThumbnail(avatarUrl)
			.setFooter({
				text: interaction.client.user.username,
				icon_url: interaction.client.user.displayAvatarURL({
					format: "png",
					dynamic: true,
				}),
			})
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("verify_confirm").setLabel("Confirm").setStyle(ButtonStyle.Primary));

		await interaction.editReply({
			embeds: [verifyEmbed],
			components: [row],
		});

		const message = await interaction.fetchReply();

		const confirmation = await message
			.awaitMessageComponent({
				componentType: ComponentType.Button,
				time: 60000,
				filter: (i) => i.user.id === discordId && i.customId === "verify_confirm",
			})
			.catch(() => null);

		if (!confirmation) {
			await db(`DELETE FROM verifications WHERE discord_id = ?`, [discordId]);

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

			return interaction.editReply({ embeds: [timeoutEmbed], components: [] });
		}

		if (!confirmation.deferred && !confirmation.replied) {
			await confirmation.deferUpdate().catch(() => {});
		}

		await interaction.editReply({
			components: [new ActionRowBuilder().addComponents(ButtonBuilder.from(row.components[0]).setDisabled(true))],
		});

		try {
			const blurb = await noblox.getBlurb(userId);
			/*const pending = db
        .prepare(`SELECT * FROM verifications WHERE discord_id = ?`)
        .get(discordId);*/
			const pendingrows = await db(
				`SELECT *
        FROM verifications
        WHERE discord_id = ?`,
				[discordId],
			);

			const pending = pendingrows[0] || null; // first row or null if not found

			if (!pending || !blurb.includes(pending.code)) {
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
				return interaction.editReply({ embeds: [failEmbed], components: [] });
			}

			/*db.prepare(`DELETE FROM verifications WHERE discord_id = ?`).run(discordId);*/
			const result = await db(`DELETE FROM verifications WHERE discord_id = ?`, [discordId]);

			console.log(`${result.affectedRows} row(s) deleted.`);

			/*db.prepare(
        `INSERT OR REPLACE INTO linked_accounts (discord_id, roblox_id, roblox_username)
         VALUES (?, ?, ?)`
      ).run(discordId, userId, username);*/
			await db(
				`INSERT INTO linked_accounts (discord_id, roblox_id, roblox_username)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                roblox_id = VALUES(roblox_id),
                roblox_username = VALUES(roblox_username)`,
				[discordId, userId, username],
			);
			const finalNickname = await assignRolesForUser(interaction, guildId, userId, username);
			await interaction.member.setNickname(finalNickname).catch(() => {});

			// 5. Log action
			const logChannelIds = ["1517324782964707530", "1517329798643581038", "1517329877978714254", "1517329973629947984", "1517330338630602822" ];

			const logEmbed = new EmbedBuilder()
				.setTitle("A user linked their Roblox account with Firefly")
				.setColor("DarkBlue")
				.addFields(
					{ name: "Discord User", value: `${interaction.user.tag} (ID: ||${interaction.user.id}||)`, inline: true },
					{
						name: "Roblox User",
						value: `${username} (ID: [${userId}](https://www.roblox.com/users/${userId}/profile))`,
						inline: true,
					},
				)
				.setFooter({
                    text: interaction.client.user.username,
                    icon_url: interaction.client.user.displayAvatarURL({
                        format: "png",
                        dynamic: true,
                    }),
                })
				.setTimestamp();

			for (const channelId of logChannelIds) {
				const logChannel = interaction.client.channels.cache.get(channelId);
				if (!logChannel) continue;

				await logChannel.send({ embeds: [logEmbed] }).catch((err) => {
					console.warn(`Failed to send log to channel ${channelId}:`, err);
				});
			}

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

			await interaction.editReply({ embeds: [successEmbed], components: [] });
		} catch (err) {
			await interaction.editReply({
				content: `Could not complete verification.\n**Error:** ${err.message}`,
				components: [],
			});
		}
	},
};
