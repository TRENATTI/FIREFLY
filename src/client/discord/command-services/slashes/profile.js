const { SlashCommandBuilder, ContainerBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ModalBuilder } = require("discord.js");
const { 
    
    tec_project_profile_selector_container, 
    tec_project_profile_selector_container_selected,
    tec_project_profile_selector_container_error,
    tec_project_profile_selector_modal,
     project_select_default, 
     project_select_cancel, 
     project_select_error 
    } = require(`./embeds/profile.js`)

const axios = require('axios')

require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("profile")
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
        .addStringOption((option) =>
			option
				.setName("username")
				.setDescription("Username used for identification within the genre project.")
				.setRequired(false)
        )
        ,
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const time = new Date();
        
        const genreValue = interaction.options.getString(`genre`)
        const usernameValue = interaction.options.getString(`username`)

        async function tec_project_profile_selector_collector_function(responseObject) {
            const collectorFilter = (i) => i.user.id === interaction.user.id;

            try {
                const confirmation =
                    await responseObject.resource.message.awaitMessageComponent({
                        filter: collectorFilter,
                        time: 60_000
                    });

                if (confirmation.customId !== 'tec_project_profile_selector_button') {
                    return;
                }

                await confirmation.showModal(tec_project_profile_selector_modal);

                const modalSubmit = await confirmation.awaitModalSubmit({
                    filter: (i) =>
                        i.user.id === interaction.user.id &&
                        i.customId === 'tec_account_selector_modal',
                    time: 60_000
                });

                const username =
                    modalSubmit.fields.getTextInputValue(
                        'tec_project_profile_selector_modal_input'
                    );

                await modalSubmit.deferUpdate();

                await responseObject.resource.message.edit({
                    components: [
                        tec_project_profile_selector_container_selected
                    ],
                    flags: MessageFlags.IsComponentsV2,
                });

                const response = await axios.post(
                    'https://users.roblox.com/v1/usernames/users',
                    {
                        usernames: [username],
                        excludeBannedUsers: false
                    }
                );

                if (response.data.data.length === 0) {
                    // Handle nonexistent Roblox user here.
                    return;
                }

                const rblxId = response.data.data[0].id;
                const rblxUsername = response.data.data[0].name;

                const thumbnailResponse = await axios.get(
                    `https://thumbnails.roblox.com/v1/users/avatar?userIds=${rblxId}&size=720x720&format=Png&isCircular=false`
                );

                if (thumbnailResponse.data.data.length === 0) {
                    return;
                }

                const thumbnail =
                    thumbnailResponse.data.data[0].imageUrl;

                await responseObject.resource.message.edit({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x0099ff)
                            .addSectionComponents((section) =>
                                section
                                    .addTextDisplayComponents((textDisplay) =>
                                        textDisplay.setContent(
                                            `# ${rblxUsername}'s The Eternal Conflict Profile\n-# This is a work in progress feature.`
                                        )
                                    )
                                    .setThumbnailAccessory((thumbnailComponent) =>
                                        thumbnailComponent
                                            .setDescription(
                                                `Roblox avatar of ${rblxUsername}`
                                            )
                                            .setURL(thumbnail)
                                    )
                            )
                            .addSeparatorComponents((separator) => separator)
                            .addActionRowComponents((actionRow) =>
                                actionRow.setComponents([
                                    new ButtonBuilder()
                                        .setCustomId('factions')
                                        .setLabel('Factions')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),

                                    new ButtonBuilder()
                                        .setCustomId('medals')
                                        .setLabel('Medals')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                        
                                    new ButtonBuilder()
                                        .setCustomId('events')
                                        .setLabel('Events')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                ])
                            )
                    ],
                    flags: MessageFlags.IsComponentsV2
                });

            } catch (error) {
                console.error(
                    new Date(),
                    '| profile.js |',
                    `${interaction.user.username} [${interaction.user.id}] failed to run an interaction!`,
                    error
                );

                await interaction.editReply({
                    components: [
                        tec_project_profile_selector_container_error
                    ],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        }

        if (genreValue == "tec") {

            const response = await interaction.reply({
                components: [
                    tec_project_profile_selector_container
                ],
                flags: MessageFlags.IsComponentsV2,
                withResponse: true,
            });

            await tec_project_profile_selector_collector_function(response)
        } else {

            const response = await interaction.reply({
                components: [
                    project_select_default
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
                            tec_project_profile_selector_container
                        ],
                        flags: MessageFlags.IsComponentsV2, 
                    });

                     await tec_project_profile_selector_collector_function(response)

                } else if (confirmation.customId === 'cancel_project') {

                    await confirmation.update({ 
                        components: [
                            project_select_cancel
                        ],
                        flags: MessageFlags.IsComponentsV2, 
                    });
                    
                }

            } catch (error) {
                console.log(
					new Date(),
					"| profile.js |",
					`${interaction.user.username} [${interaction.user.id}] failed to run an interaction! (${interaction.commandName})\nError:`,
					error
				);
                await interaction.editReply({ 
                    components: [
                        project_select_error
                    ],
                    flags: MessageFlags.IsComponentsV2, 
                });

            }
        }
	},
};
