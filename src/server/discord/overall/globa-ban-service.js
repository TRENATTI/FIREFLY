const { EmbedBuilder } = require("discord.js");
require("dotenv").config();

/**
 * Global Discord Ban Service
 *
 * Reads:
 *   blacklist/users/*
 *
 * Expected user structure:
 * {
 *   associatedAccounts: {
 *     discordAccounts: "123456789,987654321",
 *     robloxAccounts: "..."
 *   },
 *   latestUsername: "...",
 *   permanent: true
 * }
 *
 * Every 24 hours, every Discord account in the database
 * is checked against every guild the bot is in.
 */

const RUN_INTERVAL = 24 * 60 * 60 * 1000;

async function GBS(client, noblox, currentUser, admin) {
    // Keep the same developer-mode behavior as your existing module.
    /*if (process.env.DEVELOPER_MODE === "true") {
        console.log("[global-ban-service] Developer mode enabled.");
        return;
    }*/

    const db = admin.database();

    /**
     * Get all Discord IDs from the Firebase structure.
     */
    async function getBannedDiscordUsers() {
        const snapshot = await db
            .ref("blacklist")
            .child("users")
            .once("value");

        const users = snapshot.val() || {};
        const bannedUsers = new Map();

        for (const [userKey, userData] of Object.entries(users)) {
            if (!userData || !userData.associatedAccounts) {
                continue;
            }

            if (userData.permanent !== true) {
                continue;
            }

            const discordAccounts =
                userData.associatedAccounts.discordAccounts;

            if (!discordAccounts || typeof discordAccounts !== "string") {
                continue;
            }

            const discordIds = discordAccounts
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);

            for (const discordId of discordIds) {
                // Discord snowflakes are numeric strings.
                if (!/^\d{17,20}$/.test(discordId)) {
                    continue;
                }
                
                bannedUsers.set(discordId, {
                    firebaseKey: userKey,
                    username: userData.latestUsername || "Unknown User",
                    permanent: userData.permanent === true,
                });
            }
        }

        return bannedUsers;
    }

    /**
     * Ban all users found in Firebase.
     */
    async function processBans() {
        console.log(
            new Date(),
            "| global-ban-service | Starting ban synchronization..."
        );

        let bannedUsers;

        try {
            bannedUsers = await getBannedDiscordUsers();
        } catch (error) {
            console.error(
                new Date(),
                "| global-ban-service | Failed to read Firebase:",
                error
            );
            return;
        }

        console.log(
            new Date(),
            `| global-ban-service | Found ${bannedUsers.size} Discord accounts.`
        );

        if (bannedUsers.size === 0) {
            console.log(
                new Date(),
                "| global-ban-service | No Discord accounts to ban."
            );
            return;
        }

        for (const [discordId, userInfo] of bannedUsers) {
            for (const guild of client.guilds.cache.values()) {
                try {
                    if (!guild.members.me?.permissions.has("BanMembers")) {
                        console.warn(
                            `[global-ban-service] Missing Ban Members permission in ${guild.name}.`
                        );
                        continue;
                    }
                    /// Check whether the user is already banned.
                    // This works even if the user is NOT currently in the server.
                    async function isUserBanned(guild, discordId) {
                        try {
                            await guild.bans.fetch(discordId);
                            return true;
                        } catch (error) {
                            // Discord error 10026 = Unknown Ban
                            if (error.code === 10026) {
                                return false;
                            }

                            throw error;
                        }
                    }
                    const alreadyBanned = await isUserBanned(guild, discordId);

                    if (alreadyBanned) {
                        console.log(
                            `[global-ban-service] ${discordId} is already banned in ${guild.name}.`
                        );
                        continue;
                    }


                    // Prevent attempting to ban the bot itself.
                    if (discordId === client.user.id) {
                        console.warn(
                            `[global-ban-service] Skipping bot account ${discordId}.`
                        );
                        continue;
                    }

                    // Prevent attempting to ban the server owner.
                    if (guild.ownerId === discordId) {
                        console.warn(
                            `[global-ban-service] Skipping server owner ${discordId} in ${guild.name}.`
                        );
                        continue;
                    }

                    // User is not banned, so ban the Discord ID directly.
                    // This works even if they are not currently a member.
                    await guild.members.ban(discordId, {
                        reason: `Global ban service | ${userInfo.username} | ${userInfo.firebaseKey}`,
                        deleteMessageSeconds: 0,
                    });

                    console.log(
                        new Date(),
                        `| global-ban-service | Banned ${discordId} (${userInfo.username}) from ${guild.name}`
                    );
                } catch (error) {
                    console.error(
                        new Date(),
                        `| global-ban-service | Failed to ban ${discordId} from ${guild.name}:`,
                        error
                    );
                }
            }
        }

        console.log(
            new Date(),
            "| global-ban-service | Ban synchronization complete."
        );
    }

    /**
     * Run after the Discord client is ready.
     */
    const start = async () => {
        console.log(
            new Date(),
            "| global-ban-service | Service started."
        );

        // Run immediately on startup.
        await processBans();

        // Then run every 24 hours.
        setInterval(async () => {
            await processBans();
        }, RUN_INTERVAL);
    };

    if (client.isReady()) {
        await start();
    } else {
        client.once("clientReady", start);
    }
}

module.exports = GBS;
