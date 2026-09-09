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

        async function verify_button_collector_function(responseObject) {
            const collectorFilter = (i) => i.user.id === interaction.user.id;

            try {
                const confirmation =
                    await responseObject.resource.message.awaitMessageComponent({
                        filter: collectorFilter,
                        time: 60_000
                    });

                if (confirmation.customId !== 'verify_container_roblox_button') {
                    return;
                }
            
            } catch (error) {
                console.warn(
                    new Date,
                    error
                )
            }
        }

        async function makeStatecode(length) {
            var result           = '';
            var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            
            for ( var i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            
            return result;
        }

        const response = await interaction.reply({
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
                                                .setCustomId('verify_container_roblox_button')
                                                .setLabel('Verify')
                                                .setStyle(ButtonStyle.Link)
                                                .setURL(`https://authorize.roblox.com/?client_id=${process.env.ROBLOX_OAUTH2_CLIENTID}&response_type=Code&redirect_uri=https://auth.trenati.dev/redirect&scope=openid+profile&state=${code}`)
                                                .setDisabled(false),
                                    )
                                ),
                ],
                flags: MessageFlags.IsComponentsV2,
                withResponse: true,
            });

        await verify_button_collector_function(response)
            
	}
};
