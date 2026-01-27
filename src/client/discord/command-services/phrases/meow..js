module.exports = {
    name: "meow.",
    aliases: [],
    wildcard: false,
    execute(message) {
        message.channel.send({ files: [
                                 "https://github.com/Alpha-Authority/Szeebe/raw/main/Assets/Meow.mp4.mp4",
                             ],
        });
    },
};
