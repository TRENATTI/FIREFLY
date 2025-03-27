module.exports = {
	name: "sleepy",
	aliases: [],
	wildcard: true,
	execute(message) {
			const imagelist = ["https://tenor.com/view/cat-bed-bedtime-pat-tuck-in-gif-21243881","https://cdn.discordapp.com/attachments/1075266433195450408/1083614846744002600/unknown.png", "https://tenor.com/view/mimimimimi-cat-sleeping-snoring-cat-sleeping-cat-drooling-cat-gif-23979759", "https://cdn.discordapp.com/attachments/1326690316182356069/1346628286985404480/togif-5.gif?ex=67e68a92&is=67e53912&hm=b861c4e3b963fc4809247069caef76849c4e2261901b9da2612ab980321710ab&", "https://cdn.discordapp.com/attachments/807809192537882647/1269522212302618636/IMG_0743.gif?ex=67e62eb1&is=67e4dd31&hm=f1d6c77fc60749d710b30345b1476e9000dd8ffac9bfe3fee7b91a8bd8a1dd0a&"]
			const imagenumber = Math.floor(Math.random() * imagelist.length)
       		return message.channel.send(imagelist[imagenumber]);
			
	},
};
