const { EmbedBuilder } = require("discord.js");
const { format } = require("path");
require("dotenv").config();
const { stringify } = require("querystring");

async function TECHES(client, noblox, currentUser, admin) {
    var db = admin.database();
    var userCache = new Set();

    client.on("messageCreate", async (message) => {

        // Ignore bots
        if (message.author.bot) return;

        const userId = message.author.id;

        // User is currently on cooldown
        if (userCache.has(userId)) return;

        // Start 1-minute cooldown
        userCache.add(userId);

        // Remove user from cooldown after 1 minute
        setTimeout(() => {
            userCache.delete(userId);
        }, 60 * 1000);

        const userData = db.ref(
            `system/user_leveling/eternal_conflict_hub/users/user_${userId}`
        );

        userData.once("value", (snapshot) => {

            console.log(
                new Date(),
                `| xp_system.js |`,
                snapshot.val()
            );

            if (snapshot.val()) {

                const current_xp = Number(
                    snapshot.val().message_xp || 0
                );

                console.log(
                    new Date(),
                    `| xp_system.js |`,
                    current_xp
                );

                awardData(
                    false,
                    current_xp
                );

            } else {

                const current_xp = 0;

                awardData(
                    true,
                    current_xp
                );
            }
        });

        async function awardData(flag, current_points) {

            const new_total_points = current_points + 60;

            await db.ref(
                `system/user_leveling/eternal_conflict_hub/users/user_${userId}`
            ).update({
                message_xp: Number(new_total_points),
            });

            await awardRoles();
        }

        async function awardRoles(new_total_points) {

            if (Math.floor((new_total_points/60) ** .5) < 5) return;

            const guild = message.guild;
            const member = message.member;

            if (!guild || !member) return;

            let embedRole = guild.roles.cache.find(
                role => role.id === "1494030512069677176"
            );

            let embedBannedRole = guild.roles.cache.find(
                role => role.name === "embed banned"
            );

            if (!embedRole || !embedBannedRole) {

                console.warn(
                    "Could not find Embed role or Embed banned role."
                );

                return;
            }

            if (
                embedRole.position <
                guild.members.me.roles.highest.position
            ) {

                if (
                    !member.roles.cache.has(embedRole.id) &&
                    !member.roles.cache.has(embedBannedRole.id)
                ) {

                    await member.roles.add(embedRole);
                }

            } else {

                console.warn(
                    "Cannot add Embed role: role is higher than or equal to the bot's highest role."
                );
            }
        }
    });
}

module.exports = TECHES;