const Discord = require('discord.js-selfbot-v13');
const keepAlive = require('../Server/server-sjs.js');

require("dotenv").config();

const { ActivityType } = require("discord.js"); // Discord.js V14
function SPS(
    bot_client,
    noblox,
    currentUser,
    admin,
    token,
    applicationid,
    prefix
) {
    const client = new Discord.Client({
        readyStatus: false,
        checkUpdate: false
    });
    function formatTime() { 
        const date = new Date();
        const options = {
            timeZone: 'ET', 
            hour12: true,
            hour: 'numeric',
            minute: 'numeric'
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    client.on('ready', async () => {
        console.clear();
        console.log(`${client.user.tag} - rich presence started!`);

        const r = new Discord.RichPresence(client)
            .setApplicationId('1202857352102150154')
            .setType('STREAMING')
            .setURL('https://www.youtube.com/watch?v=Aact08WeOqM') //Must be a youtube video link 
            .setState(`[${formatTime()}]`)
            .setName('to the stars...')
            .setDetails(`to the stars...`)
            .setStartTimestamp(Date.now())
            .setAssetsLargeImage('https://cdn.discordapp.com/avatars/809207462997000194/a_e024f84f5fb5afdf0ca6d4239b8fa983.gif') //You can put links in tenor or discord and etc.
        //.setAssetsLargeText('Large Text') //Text when you hover the Large image
        //.setAssetsSmallImage('Small Image URL') //You can put links in tenor or discord and etc.
        //.setAssetsSmallText('Small Text') //Text when you hover the Small image
        //.addButton('Discord', 'Button URL')
        //.addButton('Button 2', 'Button URL');

        client.user.setActivity(r);
        client.user.setPresence({ status: "dnd" }); //dnd, online, idle, offline

        let prevTime = null;
        setInterval(() => {
            const newTime = formatTime();
            if (newTime !== prevTime) {
                const newDetails = `to the stars...`;
                r.setDetails(newDetails);
                r.setState(`[${formatTime()}]`)
                client.user.setActivity(r);
                prevTime = newTime;
            }
        }, 15000); // Update 15 seconds
    });


    try {
        const mySecret = process.env.HOLDINGACCOUNTTOKEN
        client.login(mySecret);
        keepAlive();
    } catch (error) {
        console.log(error)
    }
}

module.exports = SPS;
