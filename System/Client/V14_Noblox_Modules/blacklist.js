
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
		var ref;
		const addorremove = interaction.options.getString("addorremove");
		console.log(addorremove)
        if (addorremove == "add"){
			doAddOrRemoveMathematicReasoning(true)
		} else if (addorremove == "remove") {
			doAddOrRemoveMathematicReasoning(false)
		}

        async function doAddOrRemoveMathematicReasoning(value) {
            const type = interaction.options.getString("type");
            console.log(type)
            if (type == "groups"){
                ref = db.ref("blacklist/groups");
                doTypeReference(value, ref)
            } else if (type == "users") {
                ref = db.ref("blacklist/users");
                doTypeReference(value, ref)
            }
        }

        async function doTypeReference(value, ref){
            const type = interaction.options.getString("input");
            const typeNumberValue = Number(type)
            console.log(typeNumberValue)
            doInputBlacklist(value, ref, typeNumberValue)
        }

        async function doInputBlacklist(value, ref, typeNumberValue) {
            const type = interaction.options.getString("type");
            try {
                console.log(typeNumberValue)
                if (type == "groups"){
                    db.ref(`blacklist/groups/GROUP_${typeNumberValue}`).set({
                        id: typeNumberValue
                    });
                    replyToUser(value, ref, typeNumberValue)
                } else if (type == "users") {
                    db.ref(`blacklist/users/GROUP_${typeNumberValue}`).set({
                        id: typeNumberValue
                    });
                    replyToUser(value, ref, typeNumberValue)
                }
            } catch (error) {
                console.log(error)
            }

        }
        async function replyToUser(value, ref, typeNumberValue) {
            const type = interaction.options.getString("type");
            if (type == "groups"){
                interaction.reply({
                    content: `Blacklisted Group ID: ${typeNumberValue}`,
                });
            } else if (type == "users") {
                interaction.reply({
                    content: `Blacklisted User ID: ${typeNumberValue}`,
                });
            }
        }
    }
}  