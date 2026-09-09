const {
    EmbedBuilder
} = require("discord.js");


/**
 * Logs verification and update events.
 *
 * @param {Object} client Discord client
 * @param {Object} admin Firebase admin instance
 * @param {Object} options Logging options
 */
async function logUpdateVerify(client, admin, options = {}) {

    const {
        guildId,
        type,
        discordUser,
        robloxUsername,
        robloxId,
        nicknameChanged,
        rolesAdded = [],
        rolesRemoved = [],
        error = null
    } = options;


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!client || !admin || !guildId) {
        return;
    }


    try {

        const db = admin.database();


        // ==========================================
        // FIND LOG CHANNEL
        // ==========================================

        const snapshot = await db
            .ref("system")
            .child("log_channels")
            .child(guildId)
            .child("updateVerify")
            .get();


        if (!snapshot.exists()) {
            return;
        }


        const logData = snapshot.val();


        if (!logData.channelId) {
            return;
        }


        // ==========================================
        // GET GUILD
        // ==========================================

        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            return;
        }


        // ==========================================
        // GET CHANNEL
        // ==========================================

        const channel = await guild.channels
            .fetch(logData.channelId)
            .catch(() => null);


        if (!channel) {

            console.warn(
                `Log channel ${logData.channelId} could not be found.`
            );

            return;
        }


        // ==========================================
        // EMBED SETTINGS
        // ==========================================

        let color = 0x5865F2;
        let title = "Verification / Update Log";


        if (type === "verify") {

            color = 0x57F287;
            title = "Roblox Verification";

        }


        if (type === "update") {

            color = 0x3498DB;
            title = "Roblox Account Update";

        }


        if (type === "error") {

            color = 0xED4245;
            title = "Verification / Update Error";

        }


        // ==========================================
        // CREATE EMBED
        // ==========================================

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setTimestamp();


        // ==========================================
        // DISCORD USER
        // ==========================================

        if (discordUser) {

            embed.addFields({
                name: "Discord User",
                value:
                    `<@${discordUser}> (\`${discordUser}\`)`,
                inline: false
            });

        }


        // ==========================================
        // ROBLOX USERNAME
        // ==========================================

        if (robloxUsername) {

            embed.addFields({
                name: "Roblox Username",
                value:
                    `\`${robloxUsername}\``,
                inline: true
            });

        }


        // ==========================================
        // ROBLOX ID
        // ==========================================

        if (robloxId) {

            embed.addFields({
                name: "Roblox ID",
                value:
                    `\`${robloxId}\``,
                inline: true
            });

        }


        // ==========================================
        // NICKNAME
        // ==========================================

        if (nicknameChanged !== undefined) {

            embed.addFields({
                name: "Nickname",
                value:
                    nicknameChanged
                        ? "Updated"
                        : "Not changed",
                inline: true
            });

        }


        // ==========================================
        // ROLES ADDED
        // ==========================================

        if (rolesAdded.length > 0) {

            embed.addFields({
                name: "Roles Added",
                value:
                    rolesAdded
                        .map(role => `<@&${role}>`)
                        .join(", "),
                inline: false
            });

        }


        // ==========================================
        // ROLES REMOVED
        // ==========================================

        if (rolesRemoved.length > 0) {

            embed.addFields({
                name: "Roles Removed",
                value:
                    rolesRemoved
                        .map(role => `<@&${role}>`)
                        .join(", "),
                inline: false
            });

        }


        // ==========================================
        // ERROR
        // ==========================================

        if (error) {

            embed.addFields({
                name: "Error",
                value:
                    `\`\`\`\n${String(error).slice(0, 1000)}\n\`\`\``,
                inline: false
            });

        }


        // ==========================================
        // SEND LOG
        // ==========================================

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {

        console.error(
            "Logger error:",
            error
        );

    }
}


module.exports = {
    logUpdateVerify
};
