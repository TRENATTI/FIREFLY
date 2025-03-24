module.exports = {
	name: "ears",
	aliases: ["im all ears","i'm all ears"],
	wildcard: true,
	execute(message) {
    const imagelist = ["https://i.gyazo.com/da6f37e4d3ab4029e0d3cf5b1435d47e.png"]
		const imagenumber = Math.floor(Math.random() * imagelist.length)
    return message.channel.send(imagelist[imagenumber]);
	},
};
