const { SlashCommandBuilder, 
    ContainerBuilder, 
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    UserSelectMenuBuilder, 
    ButtonStyle,
    TextInputStyle,
    MessageFlags
} = require("discord.js");

module.exports = {
    verify_container : new ContainerBuilder()
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
                                .setCustomId('verify_container_button')
                                .setLabel('Verify your Roblox')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(false),
                    )
                ),
}