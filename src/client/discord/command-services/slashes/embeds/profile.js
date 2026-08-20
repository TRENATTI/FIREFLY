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

const axios = require('axios')

module.exports = {
    tec_project_profile_selector_container : new ContainerBuilder()
        .setAccentColor(0x0099ff)

        .addTextDisplayComponents(
            (textDisplay) =>
                textDisplay.setContent(
                    '# The Eternal Conflict',
                ),
        )
        
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents(
                            (textDisplay) =>
                                textDisplay.setContent(
                                    '## Account Selector\n Click the button to select a profile to view.',
                                ),
                        )
                        .setButtonAccessory((button) =>
                            button
                                .setCustomId('tec_project_profile_selector_button')
                                .setLabel('Select Account to View')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(false),
                    )
                ),

    tec_project_profile_selector_container_selected : new ContainerBuilder()
        .setAccentColor(0x0099ff)

        .addTextDisplayComponents(
            (textDisplay) =>
                textDisplay.setContent(
                    '# The Eternal Conflict',
                ),
        )
        
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents(
                            (textDisplay) =>
                                textDisplay.setContent(
                                    '## Account Selector\nClick the button to select a profile to view.\n-# Account Selector modal has been opened for processing.',
                                ),
                        )
                        .setButtonAccessory((button) =>
                            button
                                .setCustomId('tec_project_profile_selector_button')
                                .setLabel('Select Account to View')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                    )
                ),
    tec_project_profile_selector_container_error : new ContainerBuilder()
        .setAccentColor(0x0099ff)

        .addTextDisplayComponents(
            (textDisplay) =>
                textDisplay.setContent(
                    '# The Eternal Conflict (Error)',
                ),
        )
        
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents(
                            (textDisplay) =>
                                textDisplay.setContent(
                                    '## Account Selector\n Click the button to select a profile to view.',
                                ),
                        )
                        .setButtonAccessory((button) =>
                            button
                                .setCustomId('tec_project_profile_selector_button')
                                .setLabel('Select Account to View')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                    )
                ),

    tec_project_profile_selector_modal : new ModalBuilder()
        .setCustomId('tec_account_selector_modal')
        .setTitle('Account Selector')
        .addLabelComponents(
            new LabelBuilder()
             // The label is a large header text that identifies the interactive component for the user.
                .setLabel('What is the individual\'s Roblox username?')
                // The description is an additional optional subtext that aids the label.
                .setDescription('Write a Roblox username in the box to view that user\'s profile. ')
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId('tec_project_profile_selector_modal_input')
                        // Short means a single line of text.
                        .setStyle(TextInputStyle.Short)
                        // Placeholder text displayed inside the text input box
                        .setPlaceholder('Roblox username')
                        .setMaxLength(21)
                        // Set the minimum number of characters required for submission
                        .setMinLength(2)
                        .setRequired(true)
                        .setValue(`Default`)
                )
        ),

    project_select_default : new ContainerBuilder()
        .setAccentColor(0x0099ff)

        .addTextDisplayComponents(
            (textDisplay) =>
                textDisplay.setContent(
                    '# Select a project.',
                ),
        )
        
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
            section
                .addTextDisplayComponents(
                    (textDisplay) =>
                        textDisplay.setContent(
                            '## The Eternal Conflict\nOne of *Trenati Studio*\'s Roblox game genre projects. View your profile within the massive world of the Eternal Conflict.',
                        ),
                )
                .setButtonAccessory((button) =>
                    button
                        .setCustomId('the_eternal_conflict_project')
                        .setLabel('The Eternal Conflict')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(false),
            )
        )
        .addSectionComponents((section) =>
            section
                .addTextDisplayComponents(
                    (textDisplay) =>
                        textDisplay.setContent(
                            '## Cancel\nCancel your selection.',
                        ),
                )
                .setButtonAccessory((button) =>
                    button
                        .setCustomId('cancel_project')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false),
                ),
            ),

        project_select_cancel : new ContainerBuilder()
            .setAccentColor(0x0099ff)

            .addTextDisplayComponents(
                (textDisplay) =>
                    textDisplay.setContent(
                        '# Select a project (Cancelled).',
                    ),
            )
            
            .addSeparatorComponents((separator) => separator)
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents(
                        (textDisplay) =>
                            textDisplay.setContent(
                                '## The Eternal Conflict\nOne of *Trenati Studio*\'s Roblox game genre projects. View your profile within the massive world of the Eternal Conflict.',
                            ),
                    )
                    .setButtonAccessory((button) =>
                        button
                            .setCustomId('the_eternal_conflict_project')
                            .setLabel('The Eternal Conflict')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                )
            )
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents(
                        (textDisplay) =>
                            textDisplay.setContent(
                                '## Cancel\nCancel your selection.',
                            ),
                    )
                    .setButtonAccessory((button) =>
                        button
                            .setCustomId('cancel_project')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    ),
                ),

        project_select_error : new ContainerBuilder()
            .setAccentColor(0x0099ff)

            .addTextDisplayComponents(
                (textDisplay) =>
                    textDisplay.setContent(
                        '# Select a project (Errored).',
                    ),
            )
            
            .addSeparatorComponents((separator) => separator)
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents(
                        (textDisplay) =>
                            textDisplay.setContent(
                                '## The Eternal Conflict\nOne of *Trenati Studio*\'s Roblox game genre projects. View your profile within the massive world of the Eternal Conflict.',
                            ),
                    )
                    .setButtonAccessory((button) =>
                        button
                            .setCustomId('the_eternal_conflict_project')
                            .setLabel('The Eternal Conflict')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                )
            )
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents(
                        (textDisplay) =>
                            textDisplay.setContent(
                                '## Cancel\nCancel your selection.',
                            ),
                    )
                    .setButtonAccessory((button) =>
                        button
                            .setCustomId('cancel_project')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    ),
                ),
}