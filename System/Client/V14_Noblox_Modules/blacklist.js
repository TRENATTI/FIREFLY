
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
                .setRequired(true)
		)
        .addBooleanOption((option) =>
            option
                .setName('permanent')
                .setDescription('Permamency of Blacklist')
		),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
        const db = admin.database();

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
            const inputNumberValue = Number(interaction.options.getString("input"))
            const permanentBoolValue = Boolean(interaction.options.getBoolean("permanent"))
            doInputBlacklist(value, type, inputNumberValue, permanentBoolValue)
        }

        async function doInputBlacklist(value, type, inputNumberValue, permanentBoolValue) {
            try {
                if (value == true) {
                    db.ref(`blacklist/${type}/${type}_${inputNumberValue}`).set({
                        id: inputNumberValue,
                        permanent: permanentBoolValue
                    });
                    replyToUser(value, type, inputNumberValue)
                } else {
                    db.ref(`blacklist/${type}/${type}_${inputNumberValue}`).remove()
                    replyToUser(value, type, inputNumberValue)
                }
            } catch (error) {
                console.log(new Date(),
                "| blacklist.js |", error)
                interaction.reply({
                    content: `Failed!`,
                })
            }

        }

        async function replyToUser(value, type, inputNumberValue) {
            if (value == true){
                interaction.reply({
                    content: `Blacklisted ${type}Id: ${inputNumberValue}`,
                });
            } else {
                interaction.reply({
                    content: `Unblacklisted ${type}Id: ${inputNumberValue}`,
                });
            }
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