require('dotenv').config()
const axios = require('axios')
module.exports = {
    name: 'robloxavatar',
    description: 'Avatar.',
    aliases: ['rav'],
    execute(message, args) {
        console.log(args[1], args[0])

        var usernameParam = {
            "usernames": [
                args[0]
            ],
            "excludeBannedUsers": false
        }
        axios.post(`https://users.roblox.com/v1/usernames/users`, usernameParam)
            .then(function (response){
                console.log(response.data)
                if (response.data.data.length == 0){
                    var badEmbed = new Discord.MessageEmbed()
                        .setColor(0xf54242)
                        .setDescription(`User **${args[0]}** doesn't exist!`)
                    console.log(badEmbed)
                    return message.channel.send(badEmbed);
                }else{
                    rblx_id = response.data.data[0].id;
                    rblx_username = response.data.data[0].name
                    getThumbnail(rblx_id, rblx_username)
                }
            })
            .catch(error => console.log(error));
        function getThumbnail(rblx_id, rblx_username) {
            axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${rblx_id}&size=720x720&format=Png&isCircular=false`)
                .then(function (response){
                    console.log(response.data)
                    if (response.data.data.length == 0){
                        var badEmbed = new Discord.MessageEmbed()
                            .setColor(0xf54242)
                            .setDescription(`User **${args[0]}** doesn't exist!`)
                        console.log(badEmbed)
                        return message.channel.send(badEmbed);
                    }else{
                        const thumbnail = response.data.data[0].imageUrl
                        doEmbed(thumbnail, rblx_username)
                    }
                })
                .catch(error => console.log(error));
        }
        function doEmbed(thumbnail, rblx_username) {
            const embedAA = {
                "author": {
                    "name": message.client.user.username,
                    "icon_url": message.client.user.displayAvatarURL({ format: "png", dynamic: true })
                },
                color: 0x0099ff,
                "footer": {
                    "text": message.guild.name,
                    "icon_url":  message.guild.iconURL({ format: "png", dynamic: true })
                },
                "description": `${rblx_username}'s Avatar!`,
                timestamp: new Date(),
                "image": {
                    "url": `${thumbnail}`
                  }
            }
            return message.channel.send({ embeds: [embedAA] });
        }
    }
}
