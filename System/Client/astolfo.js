require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");

function astolfo(client) {
  let i = 0;
  const photos = [
    "https://cdn.discordapp.com/attachments/809592756946206751/1001874995577892974/welcomegayhaha.gif",
    "https://cdn.discordapp.com/attachments/809592756946206751/1001874994768379914/welcgay3.gif",
    "https://cdn.discordapp.com/attachments/809592756946206751/1001874994013421588/welcgay2.gif",
  ];

  client.on("guildMemberAdd", (member) => {
    if (!member.guild.id == 215221157937283075) return;
    embedX = {
      title: "",
      color: 13193877,
      description: `Welcome **${
        member.user.username
      }**! We are glad to see you here, Now you are officially part **of Space Bubble**\n\nPlease read the #info-and-rules and also get some nice roles from #self-roles. **And don't forget to say hi!**\n\n**Account created on** <t:${Math.round(
        member.user.createdTimestamp / 1000
      )}:f>`,
      timestamp: Date.now(),
      author: {
        name: "",
      },
      image: {
        url: `${photos[i++ % photos.length]}`,
      },
      thumbnail: {
        url: "",
      },
      footer: {
        text: `${member.user.tag} is our ${member.guild.memberCount} member • ID: ${member.id}`,
      },
      fields: [],
    };
    member.guild.channels.cache
      .get("710591152113451088")
      .send({ embeds: [embedX] });
  });
}

module.exports = astolfo;
