
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
            option
				.setName("type")
				.setDescription("<add/remove>")
				.setRequired(true)
				.addChoices(
					{ name: "User", value: "user" },
					{ name: "Group", value: "group" }
				),
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
			ref = db.ref("blacklist/users");
			doAddOrRemoveMathematicReasoning(false)
		}

        async function doAddOrRemoveMathematicReasoning(value) {
            const type = interaction.options.getString("type");
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
            try {
                const typeNumberValue = Number(type)
                doInputBlacklist(value, ref, typeNumberValue)
            } catch (error) {
                console.log(error)
            }
        }

        async function doInputBlacklist(value, ref, typeNumberValue) {


        }

        if (args[0] == 'add'){ 
            addorremove('add')
        } else if (args[0] == 'remove') {
            addorremove('remove')
        } else {
            return message.reply (`You didn't provide an argument to add or remove! Try "aa>help blacklist" for this commands usage.`)
        }
        function addorremove(value){
            
            if (args[1] == 'group') {

                if (!isNum(args[2])) return message.reply(`You didn't provide an argument that's a number! Try "aa>help blacklist" for this commands usage.`)
                axios.get('https://groups.roblox.com/v1/groups/' + args[1])
                    .then(function (response) {
                       if (!response.data.errors) {
                            var groupName = response.data.name
                            var workinEmbed = new Discord.MessageEmbed()
                        		.setDescription(`Working on the blacklist...`);
                            message.channel.send(workinEmbed).then(message => message.delete({ timeout: 1000, reason: "delete working message" }));
                            axios.get(`${process.env.SA_DATABASEURL}blacklist/groups/${args[1]}.json`)
                                .then(function (response) {
                                    console.log(response.data)
                                    if (!response.data){
                                        gbit(true);
                                    }else{
                                        gbit(false);
                                    }
                                })
                
                            function gbit(anothervalue){
                                if (anothervalue === false && value == 'add'){return message.channel.send(groupName + ` is already a blacklisted group!`)}
                                if (anothervalue === false && value == 'add'){return message.channel.send(groupName + ` is already a blacklisted group!`)}
                                db.ref(`blacklist/groups/${args[1]}`).set({
                                  name: groupName
                                });
                                var doneEmbed = new Discord.MessageEmbed()
                                    .setColor(0xFF8C00)
                                    .setDescription(`Created ${rblx_username}'s profile`)
                                return message.channel.send(doneEmbed)
                            }
                       } else {
                            return message.reply (`You didn't provide an existing group's id!`)
                       }
                    });
    
            } else if (args[1] == 'user') {
                
            } else {
                    return message.reply (`You didn't provide an argument for whether you want to do a user or group! Try "aa>help blacklist" for this commands usage.`)
            }
            axios.get('https://groups.roblox.com/v1/groups/' + args[1])
                .then(function (response) {
                   if (!response.data.errors) {
                       getRobloxUsername(true, response.data.roblox_id)
                   } else {
                       return message.reply
                   }
                });
        }
    }
}  