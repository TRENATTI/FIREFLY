const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const util = require("util");
const child_process = require("child_process");
const process = require("process");
require("dotenv").config();

const exec = util.promisify(child_process.exec);

async function execSh(command) {
	await exec(command, { windowsHide: true }, (e, stdout, stderr) => {
		console.log(`${stdout}\n`);
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reset")
		.setDescription("Admin internal command."),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
		async function reset(interaction) {
			//execSh("pm2 restart all")
			var db = admin.database();
			db.ref("szeebe/alapha-universe-docs-ready").set(true);
			db.ref("szeebe/alapha-universe-docs-signature/Groups/getGroup").set(
				true
			);
			db.ref(
				"szeebe/alapha-universe-docs-signature/Groups/getGroupFunds"
			).set(true);
			db.ref(
				"szeebe/alapha-universe-docs-signature/Groups/getGroupGames"
			).set(true);
			db.ref(
				"szeebe/alapha-universe-docs-signature/Groups/getGroupSocialLinks"
			).set(true);
			db.ref("szeebe/alapha-universe-docs-signature/Groups/getRoles").set(
				true
			);
			db.ref("szeebe/alapha-universe-docs-signature/Groups/getShout").set(
				true
			);
			db.ref("szeebe/alapha-universe-docs-signature/Groups/getLogo").set(
				true
			);
		}
		if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104" ||
			interaction.user.id == "1154775391597240391"
		) {
			interaction
				.reply({
					content: `Resetting to Ready State!`,
				})
				.then(reset(admin));
		} else {
			return interaction.reply({
				content: `Sorry ${message.author}, but only the owners can run that command!`,
			});
		}
	},
};
