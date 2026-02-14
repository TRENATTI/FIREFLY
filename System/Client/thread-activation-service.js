require("dotenv").config();
const { ComponentType } = require("discord.js");

async function TAS(
    client,
    noblox,
    currentUser,
    admin,
    token,
    applicationid,
    prefix
) {
    client.once("ready", async () => {
        //if (process.env.DEVELOPER_MODE == "true" || process.env.DATABASE_MODE == "true") return;

        async function keepThreadActive() {
            const channels = [
                                    // Vyhalla
            "1402875758841696271",  // Community Feeds TRENATI :: Development Livestreams
            "1403058887845875752",  // Community Feeds MINAC :: State Sponsored & Internal Publications
            "1402875273808183396",  // Community Feeds TRENATI :: Development Video Releases
                                    
            "1402900035758329887",  // Community News ORGNEWS :: Organization Transparency
            "1402897862953795597",  // Community News ORGNEWS :: Organization Applications

            "1421059005358542879", // External Announcements TRENATI :: Global Broadcasts
            "1421059300809379901", // External Announcements THE MEMORIES PROJECT :: Art Archive
            
                                   // The Peace Summit
            "1421059784001454200", // External Announcements TRENATI :: Global Broadcasts
        ];

            try {
                for (const key in channels) {
                     const channelId = channels[key];
                    const channel = await client.channels.fetch(channelId);
                    console.log(`Fetched channel: ${channel.name}`);
                    const msg = await channel.send({
                        content: "-# This message is sent to keep this thread active for the general public to see. It will delete momentarily."
                    });

                    await new Promise(res => setTimeout(res, 5000));
                    await msg.delete().catch(console.error);
                }
            } catch (error) {
                console.error(error);
            }
        };

        keepThreadActive();
        setTimeout(keepThreadActive, 259200 * 1000);
    });
}

module.exports = TAS;
