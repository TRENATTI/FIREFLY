module.exports = {
	name: "seal",
	aliases: [],
	wildcard: true,
	nocooldown: true,
	execute(message) {
		const imagelist = [
			"https://imgur.com/c14mP0k",
			"https://imgur.com/mldS2DA",
			"https://imgur.com/bP8aylA",
			"https://imgur.com/HAxoWZW",
			"https://imgur.com/Du0tajH",
			"https://imgur.com/zYlFBuh",
			"https://imgur.com/ihH0YBp",
			"https://imgur.com/QpjNZFm",
			"https://imgur.com/WxEn7mk",
			"https://imgur.com/a33u8ev",
			"https://imgur.com/f9EeHaH"
		]
		const imagenumber = Math.floor(Math.random() * imagelist.length)
		return message.channel.send(imagelist[imagenumber]);
			
	},
};
 