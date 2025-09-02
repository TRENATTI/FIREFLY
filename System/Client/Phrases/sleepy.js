module.exports = {
	name: "sleepy",
	aliases: [],
	wildcard: true,
	nocooldown: true,
	execute(message) {
		const imagelist = ["https://imgur.com/DSKJWWl",
			"https://imgur.com/yfhELBJ",
			"https://imgur.com/iSkZE1O",
			"https://imgur.com/VOyMgWi",
			"https://i.imgur.com/Ft5Qc3q.gif", 
			"https://imgur.com/I1A8niK", 
			"https://imgur.com/rhtXnVh",
			"https://imgur.com/wxNirzf",
			"https://imgur.com/cJb5NCu",
			"https://imgur.com/gzgwEfd",
			"https://imgur.com/8rUYli6",
			"https://imgur.com/uscDCKl",
			"https://imgur.com/iU7OC3Z",
			"https://imgur.com/lhXnfSH",
			"https://imgur.com/RN7Zy7H"
		]
		const imagenumber = Math.floor(Math.random() * imagelist.length)
		return message.channel.send(imagelist[imagenumber]);
			
	},
};
 