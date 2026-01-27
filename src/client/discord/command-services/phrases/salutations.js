module.exports = {
	name: "salutations",
	aliases: [],
	wildcard: true,
	execute(message) {
		return message.channel.send(
			"https://tenor.com/view/capybara-salutations-my-good-chum-gif-26610666"
		);
	},
};
