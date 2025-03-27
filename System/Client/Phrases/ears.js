module.exports = {
	name: "ears",
	aliases: ["im all ears","i'm all ears"],
	wildcard: true,
	execute(message) {
    	const imagelist = ["https://i.gyazo.com/da6f37e4d3ab4029e0d3cf5b1435d47e.png", "https://i.gyazo.com/c2817d20fef2bb89ae9cb1eb0533f358.jpg","https://cdn.discordapp.com/attachments/1074088257266122783/1350004596931690546/caption.gif?ex=67e64cc1&is=67e4fb41&hm=dcb17e57100734e978d9d9e74d4414411e6a699d1991d8e70fb2f5f4cf4c620d&"]
	    const imagenumber = Math.floor(Math.random() * imagelist.length)
        return message.channel.send(imagelist[imagenumber]);
	},
};
