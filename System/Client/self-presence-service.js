const Discord = require('discord.js-selfbot-v13');
const keepAlive = require('../Server/server.js');

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
    keepAlive();
    function formatTime() { //Credits to himika#0001 and never#0001
        const date = new Date();
        const options = {
            timeZone: 'GMT', //https://www.zeitverschiebung.net/en/ and find your city and enter here
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
            .setAssetsLargeImage('https://cdn.discordapp.com/banners/255079576059772928/cf6676c8239cebd582a15d02e1802f82.webp?size=1024') //You can put links in tenor or discord and etc.
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
    } catch (error) {
        console.log(error)
    }
}

module.exports = SPS;
