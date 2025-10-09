
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
		)
        .addStringOption((option) =>
            option
                .setName('associated_roblox_accounts')
                .setDescription('Associated Roblox Accounts')
                .setRequired(false)
		)
        .addStringOption((option) =>
            option
                .setName('associated_discord_accounts')
                .setDescription('Associated Discord Accounts')
                .setRequired(false)
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
            doTypeReasoning(value, type, inputNumberValue, permanentBoolValue)

        }

        async function doTypeReasoning(value, type, inputNumberValue, permanentBoolValue) {
            if (type == "users") {
                findLatestUsername(value, type, inputNumberValue, permanentBoolValue)
            } else if (type == "groups") {
                
            }
        }

        async function findLatestUsername(value, type, inputNumberValue, permanentBoolValue) {
            var username
            username = ``

            var userIdsParam = {
				userIds: [inputNumberValue],
				excludeBannedUsers: false,
			};

            axios
                .post(
                    `https://users.roblox.com/v1//users`,
                    userIdsParam
                )
                .then(function (response) {
                    console.log(response.data);
                    if (response.data.data.length == 0) {
                        username = `N/A`
                        setAssociatedRobloxAccounts(value, type, inputNumberValue, permanentBoolValue, username)
                    } else {
                        username = response.data.data[0].name;
                        setAssociatedRobloxAccounts(value, type, inputNumberValue, permanentBoolValue, username)
                    }
            })
        }

        async function setAssociatedRobloxAccounts(value, type, inputNumberValue, permanentBoolValue, username) {
            const robloxAccountsValue = Array(interaction.options.getString("associated_roblox_accounts"))
            let robloxAccountsArray = `N/A`
            if (Array.isArray(robloxAccountsValue)) {
                if (robloxAccountsValue.length > 0) {
                    robloxAccountsArray = robloxAccountsValue
                    setAssociatedDiscordAccounts(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray)
                }
                else {
                    setAssociatedDiscordAccounts(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray)
                }
            } else {
                setAssociatedDiscordAccounts(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray)
            }
        }

        async function setAssociatedDiscordAccounts(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray) {
            const discordAccountsValue = Array(interaction.options.getString("associated_discord_accounts"))
            let discordAccountsArray = `N/A`
            if (Array.isArray(discordAccountsValue)) {
                if (discordAccountsValue.length > 0) {
                    discordAccountsArray = discordAccountsValue
                    doInputBlacklist(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray, discordAccountsArray)
                }
                else {
                    doInputBlacklist(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray, discordAccountsArray)
                }
            } else {
                doInputBlacklist(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray, discordAccountsArray)
            }
        }
        
        async function doInputBlacklist(value, type, inputNumberValue, permanentBoolValue, username, robloxAccountsArray, discordAccountsArray) {
            try {
                if (value == true) {
                    db.ref(`blacklist/${type}/${type.slice(0, -1)}_${inputNumberValue}`).set({
                        permanent: permanentBoolValue,
                        latestUsername: `${username}`,
                        associatedAccounts: {
                            robloxAccounts: `${robloxAccountsArray}`,
                            discordAccounts: `${discordAccountsArray}`
                        }
                    });
                    replyToUser(value, type, inputNumberValue)
                } else {
                    db.ref(`blacklist/${type}/${type.slice(0, -1)}_${inputNumberValue}`).remove()
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
                    content: `Blacklisted ${type.slice(0, -1)} Id: ${inputNumberValue}`,
                });
            } else {
                interaction.reply({
                    content: `Unblacklisted ${type.slice(0, -1)} Id: ${inputNumberValue}`,
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
					setTimeout(() => message.delete(), 10_000)
				);
		}
    }
}  