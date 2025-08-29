module.exports = {
	name: "ears",
	aliases: ["im all ears","i'm all ears"],
	wildcard: true,
	nocooldown: true,
	execute(message) {
    	const imagelist = ["https://imgur.com/E5LJhoD", 
			"https://imgur.com/9GL9m70",
			"https://imgur.com/ZcWde1s", 
			"https://imgur.com/C4Qy5rp", 
			"https://imgur.com/nWROOfW",
			"https://imgur.com/7HybEYy",
			"https://imgur.com/AqZWolo",
			"https://imgur.com/2XRjP7E",
			"https://imgur.com/0H0DQvg",
			"https://imgur.com/mBjp5kS",
			"https://imgur.com/4JARohg",
			"https://imgur.com/FldO8GG"
			
		]
	    const imagenumber = Math.floor(Math.random() * imagelist.length)
        return message.channel.send(imagelist[imagenumber]);
	},
};