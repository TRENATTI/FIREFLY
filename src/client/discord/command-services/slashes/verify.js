const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verify")
		.setDescription(
			"Verify your account with our services."
		),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction, noblox, admin) {
        const db = admin.database();

		try {
            async function checkRealtimeData(nodePath) {
                const ref = db.ref(nodePath);
                const snapshot = await ref.once('value');

                if (snapshot.exists()) { 
                    console.log("Data exists:", snapshot.val());
                    return true;
                } else {
                    console.log("No data at this path.");
                    return false;
                }
            }

            const snapshot = await db
                .ref("system")
                .child("user_verification")
                .child(`discord_${interaction.user.id}`)
                .once("value");
            
            if (snapshot.exists()) {
                verifyUser(true) // Restart Auth Data
            } else {
                verifyUser(false) // Start New Auth Data
            }

            async function verifyUser(flag) {
                console.log(new Date(), 
                flag)
            }
        } catch (error) {

        }
	},
};
