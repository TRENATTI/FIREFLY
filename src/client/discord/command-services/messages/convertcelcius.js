module.exports = {
	name: "convertcelcius",
	description: "Converts Celcius into Fahrenheit.",
	aliases: ["cc"],
	execute(message, args, client, noblox, admin) {
		if (!isNaN(args[0])) {
			return message.reply(
				Math.round(((9 / 5) * args[0] + 32) * 100) / 100 +
					" Fahrenheit."
			);
		}
	},
};
