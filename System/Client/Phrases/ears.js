module.exports = {
	name: "ears",
	aliases: ["im all ears","i'm all ears"],
	wildcard: true,
	execute(message) {
    	const imagelist = ["https://i.gyazo.com/da6f37e4d3ab4029e0d3cf5b1435d47e.png", "https://i.gyazo.com/c2817d20fef2bb89ae9cb1eb0533f358.jpg"]
	    const imagenumber = Math.floor(Math.random() * imagelist.length)
        return message.channel.send(imagelist[imagenumber]);
	},
};
