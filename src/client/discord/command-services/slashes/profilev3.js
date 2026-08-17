const { SlashCommandBuilder, ContainerBuilder, UserSelectMenuBuilder, ButtonStyle, MessageFlags } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("profilev3")
		.setDescription(
			"Profile V3 testing."
		)
        .addStringOption((option) =>
			option
				.setName("genre")
				.setDescription("Genre project to pick.")
				.setRequired(false)
				.addChoices(
					{ name: "The Eternal Conflict", value: "tec" },
				),
        )
        ,
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const time = new Date();
        
        const genreValue = interaction.options.getString(`genre`)

        if (genreValue == "tec") {
            const response = await interaction.reply({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0x0099ff)

                        .addTextDisplayComponents(
                            (textDisplay) =>
                                textDisplay.setContent(
                                    '# The Eternal Conflict',
                                ),
                        )
                        
                        .addSeparatorComponents((separator) => separator)    
                ],
                flags: MessageFlags.IsComponentsV2,
                withResponse: true,
            });
        } else {
            const response = await interaction.reply({
            components: [
                new ContainerBuilder()
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
                        )
            ],
            flags: MessageFlags.IsComponentsV2,
            withResponse: true,
        });

        const collectorFilter = (i) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'the_eternal_conflict_project') {
                await confirmation.update({ 
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x0099ff)
                            
                            .addTextDisplayComponents(
                                (textDisplay) =>
                                    textDisplay.setContent(
                                        '# The Eternal Conflict',
                                    ),
                            )
                    ],
                    flags: MessageFlags.IsComponentsV2, 
                });
            } else if (confirmation.customId === 'cancel_project') {
                 await confirmation.update({ 
                    components: [
                        new ContainerBuilder()
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
                                )
                    ],
                    flags: MessageFlags.IsComponentsV2, 
                });
            }
        } catch {
            await interaction.editReply({ components: [
              new ContainerBuilder()
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
                                )
                ],
                flags: MessageFlags.IsComponentsV2, 
            });
        }
        }
    
		
	},
};
