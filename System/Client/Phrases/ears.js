module.exports = {
	name: "ears",
	aliases: ["im all ears","i'm all ears"],
	wildcard: true,
	execute(message) {
    	const imagelist = ["https://i.gyazo.com/da6f37e4d3ab4029e0d3cf5b1435d47e.png", 
			"https://i.gyazo.com/c2817d20fef2bb89ae9cb1eb0533f358.jpg",
			"https://imgur.com/E5LJhoD", 
			"https://imgur.com/9GL9m70", 
			"https://imgur.com/ZcWde1s",
			"https://tenor.com/view/cat-ears-big-ears-heard-dontdox-gif-8768405185234347446",
			"https://tenor.com/view/cuddles-cuddle-cat-cat-cuddle-sleepy-cat-cat-sleepy-gif-13127427148831486106",
			"https://tenor.com/view/cat-cats-cat-sleep-sleep-sleeping-gif-23371265",
			"https://tenor.com/view/cat-cheese-gif-21052324",
			
		]
	    const imagenumber = Math.floor(Math.random() * imagelist.length)
        return message.channel.send(imagelist[imagenumber]);
	},
};