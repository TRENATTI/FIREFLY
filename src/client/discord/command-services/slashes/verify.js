const { SlashCommandBuilder, 
    ContainerBuilder, 
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    UserSelectMenuBuilder, 
    ButtonStyle,
    TextInputStyle,
    MessageFlags } = require("discord.js");
require("dotenv").config();

const {
    verify_container
 } = require(`./embeds/verify.js`)
const crypto = require("crypto");

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

            const ref = db
                .ref("system")
                .child("user_verification")
                .child(`discord_${interaction.user.id}`);

            const state =
                crypto.randomBytes(32).toString("hex");

            await ref.update({

                verificationGuildID:
                    interaction.guild.id,

                verified:
                    false,

                statecode:
                    state,

                discordID:
                    interaction.user.id
            });

            await interaction.reply({

                components: [

                    new ContainerBuilder()
                        .setAccentColor(0x0099ff)

                        .addTextDisplayComponents(
                            textDisplay =>
                                textDisplay.setContent(
                                    "# Verify"
                                )
                        )

                        .addSeparatorComponents(
                            separator => separator
                        )

                        .addSectionComponents(
                            section =>
                                section

                                    .addTextDisplayComponents(
                                        textDisplay =>
                                            textDisplay.setContent(
                                                "## Roblox Account Verifier\n" +
                                                "Click the button to verify your Roblox Account."
                                            )
                                    )

                                    .setButtonAccessory(
                                        button =>
                                            button
                                                .setLabel("Verify")
                                                .setStyle(
                                                    ButtonStyle.Link
                                                )
                                                .setURL(
                                                    `https://auth.trenati.dev/?state=${encodeURIComponent(state)}`
                                                )
                                    )
                        )
                ],

                ephemeral: true,

                flags:
                    MessageFlags.IsComponentsV2,

                withResponse:
                    false
            });

        } catch (error) {

            console.warn(
                "Verification command error:",
                error
            );

        }
    }
};
