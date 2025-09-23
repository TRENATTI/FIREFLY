module.exports = {
	name: "seal",
	aliases: [],
	wildcard: true,
	nocooldown: true,
	execute(message) {
		const imagelist = [
			"https://imgur.com/c14mP0k"
		]
		const imagenumber = Math.floor(Math.random() * imagelist.length)
		return message.channel.send(imagelist[imagenumber]);
			
	},
};
 