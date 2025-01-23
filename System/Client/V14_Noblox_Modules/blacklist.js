
require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("blacklist")
		.setDescription("Add and remove blacklisting for groups and users.")
		.addStringOption((option) =>
			option
				.setName("addorremove")
				.setDescription("<add/remove>")
				.setRequired(true)
				.addChoices(
					{ name: "Add", value: "add" },
					{ name: "Remove", value: "remove" }
				),
        )
        .addStringOption((option) =>
            option
				.setName("type")
				.setDescription("<add/remove>")
				.setRequired(true)
				.addChoices(
					{ name: "User", value: "users" },
					{ name: "Group", value: "groups" }
				),
            )
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('User ID / Group ID')
		),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
        const db = admin.database();
		const bindedData = [];

        async function isAuthorized() {
            const addorremove = interaction.options.getString("addorremove");
            if (addorremove == "add"){
                doAddOrRemoveMathematicReasoning(true)
            } else if (addorremove == "remove") {
                doAddOrRemoveMathematicReasoning(false)
            }
        }

        async function doAddOrRemoveMathematicReasoning(value){
            const type = interaction.options.getString("type");
            const typeNumberValue = Number(interaction.options.getString("input"))
            doInputBlacklist(value, type, typeNumberValue)
        }

        async function doInputBlacklist(value, type, typeNumberValue) {
            try {
                if (value == true) {
                    db.ref(`blacklist/${type}/${type}_${typeNumberValue}`).set({
                        id: typeNumberValue
                    });
                    replyToUser(value, type, typeNumberValue)
                } else {

                }
            } catch (error) {
                console.log(error)
            }

        }
        async function replyToUser(value, type, typeNumberValue) {
             interaction.reply({
                    content: `Blacklisted ${type}Id: ${typeNumberValue}`,
                });
        }
        if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104" ||
			interaction.user.id == "1154775391597240391"
		) {
			isAuthorized();
		} else {
			return interaction
				.reply({
					content: `Sorry ${message.author}, but only the owners can run that command!`,
				})
				.then((message) =>
					message.delete({ timeout: 5000, reason: "delete" })
				);
		}
    }
}  