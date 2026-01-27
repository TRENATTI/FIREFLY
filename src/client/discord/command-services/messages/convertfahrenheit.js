module.exports = {
	name: "convertfahrenheit",
	description: "Converts Fahrenheit into Celcius.",
	aliases: ["cf"],
	execute(message, args) {
		if (!isNaN(args[0])) {
			return message.reply(
				Math.round((5 / 9) * (args[0] - 32) * 100) / 100 + " Celcius."
			);
		}
	},
};
