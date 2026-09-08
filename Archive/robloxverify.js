const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const noblox = require("noblox.js");
const crypto = require("crypto");
const https = require("https");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("robloxverify")
		.setDescription(
			"Verify your Roblox account."
		),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const time = new Date();
	
	},
};
