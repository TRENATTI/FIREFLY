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
            const ref = await db
                        .ref("system")
                        .child("user_verification")
                        .child(`discord_${interaction.user.id}`);

            const code = makeStatecode(10)

            await ref.update({
                verificationChannelID: interaction.channel.id,
                verified: false,
                statecode: code,
                discordID: interaction.user.id
            });


            function makeStatecode(length) {
                var result           = '';
                var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                
                for ( var i = 0; i < length; i++ ) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                
                return result;
            }

            await interaction.reply({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x0099ff)

                            .addTextDisplayComponents(
                                (textDisplay) =>
                                    textDisplay.setContent(
                                        '# Verify',
                                    ),
                            )
                            .addSeparatorComponents((separator) => separator)
                            .addSectionComponents((section) =>
                                        section
                                            .addTextDisplayComponents(
                                                (textDisplay) =>
                                                    textDisplay.setContent(
                                                        '## Roblox Account Verifier\nClick the button to verify your Roblox Account.',
                                                    ),
                                            )
                                            .setButtonAccessory((button) =>
                                                button
                                                    .setLabel('Verify')
                                                    .setStyle(ButtonStyle.Link)
                                                    .setURL(`https://authorize.roblox.com/?client_id=6366461420549717155&response_type=Code&redirect_uri=https://auth.trenati.dev/redirect&scope=openid+profile&state=${code}`)
                                                    .setDisabled(false),
                                        )
                                    ),
                    ],
                    ephemeral: true,
                    flags: MessageFlags.IsComponentsV2,
                    withResponse: false,
                });

        } catch (error) {
            console.log(error)
        }            
	}
};
