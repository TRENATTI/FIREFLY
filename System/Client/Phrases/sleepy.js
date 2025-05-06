module.exports = {
	name: "sleepy",
	aliases: [],
	wildcard: true,
	execute(message) {
			const imagelist = ["https://imgur.com/DSKJWWl",
				"https://imgur.com/yfhELBJ",
				"https://imgur.com/iSkZE1O",
				"https://tenor.com/view/cat-bed-bedtime-pat-tuck-in-gif-21243881",
				"https://tenor.com/view/kitty-review-eepy-kitty-sleepy-cat-sleepy-kitty-gif-15376148450942612603", 
				"https://tenor.com/view/mimimimimi-cat-sleeping-snoring-cat-sleeping-cat-drooling-cat-gif-23979759", 
				"https://tenor.com/view/bunny-sleepy-gooba-owa-owaowa-gif-2311503198775714764",
				"https://tenor.com/view/sleep-sleeping-cat-eepy-cat-eepy-kitty-gif-11184483905395278742",
				"https://tenor.com/view/orange-cat-liquid-cup-cute-gif-5803945508306517547"
			]
			const imagenumber = Math.floor(Math.random() * imagelist.length)
       		return message.channel.send(imagelist[imagenumber]);
			
	},
};
