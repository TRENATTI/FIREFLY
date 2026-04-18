const {
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");
require("dotenv").config();

const noblox = require("noblox.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const PLACE_IDS = [
  { ID: 111471861137242, Active: true, Name: "Hub" },
  { ID: 127438134724972, Active: true, Name: "Ashas Ree" },
  { ID: 86342544096308, Active: false, Name: "Dantooine" },
  { ID: 73963808943204, Active: false, Name: "Illum" },
  { ID: 89135389432715, Active: false, Name: "Korriban" },
  { ID: 120951229449191, Active: false, Name: "Malachor" },
  { ID: 127247674867680, Active: true, Name: "Tython" },
  { ID: 84039799073767, Active: true, Name: "Vyzant Kaas" },
  { ID: 78813780405984, Active: false, Name: "Ziost" },
];

// ---------- Roblox Helpers ----------

async function getUniverseId(placeId) {
  const res = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
  const json = await res.json();
  return json.universeId;
}

async function getGameThumbnail(placeId) {
  const res = await fetch(
    `https://thumbnails.roblox.com/v1/places/game-thumbnails?placeIds=${placeId}&size=640x360&format=Png`
  );
  const json = await res.json();
  return json.data?.[0]?.imageUrl || null;
}

async function getGameIcon(universeId) {
  const res = await fetch(
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=256x256&format=Png`
  );
  const json = await res.json();
  return json.data?.[0]?.imageUrl || null;
}

// ---------- Server Data ----------

async function getServerData(placeIds) {
  const results = [];

  for (const place of placeIds) {
    if (!place.Active) continue;

    let cursor = null;
    let serverCount = 0;
    let playerCount = 0;

    try {
      do {
        const res = await fetch(
          `https://games.roblox.com/v1/games/${place.ID}/servers/Public?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ""}`
        );
        const json = await res.json();

        if (!json.data) break;

        serverCount += json.data.length;

        for (const server of json.data) {
          playerCount += server.playing;
        }

        cursor = json.nextPageCursor;
      } while (cursor);

      results.push({
        name: place.Name,
        servers: serverCount,
        players: playerCount,
      });

    } catch (err) {
      console.error(`Failed for ${place.Name}`, err);
    }
  }

  return results;
}

// ---------- Command ----------

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamecheck")
    .setDescription("Show servers and players across all places."),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      await noblox.setCookie(process.env.RBXCOOKIE);

      // Main place for title/image
      const universeId = await getUniverseId(PLACE_IDS[0].ID);

      let imageUrl = await getGameThumbnail(PLACE_IDS[0].ID);
      if (!imageUrl) {
        imageUrl = await getGameIcon(universeId);
      }

      const gameInfo = await noblox.getUniverseInfo([universeId]);

      // Get server data
      const serverData = await getServerData(PLACE_IDS);

      // ---- FILTER + SORT ----
      const activePlaces = serverData.filter(p => p.servers > 0);
      activePlaces.sort((a, b) => b.players - a.players);

      // ---- TOTAL PLAYERS ----
      const totalPlayers = serverData.reduce((sum, p) => sum + p.players, 0);

      // ---- BUILD FIELDS ----
      const fields = activePlaces.length > 0
        ? activePlaces.map(place => ({
            name: place.name,
            value: `🟢 ${place.players} players\n🖥️ ${place.servers} servers`,
            inline: true
          }))
        : [{
            name: "Servers",
            value: "🔴 No servers online",
            inline: false
          }];

      // ---- EMBED ----
      const embed = new EmbedBuilder()
        .setTitle(gameInfo[0].name)
        .setDescription(`👥 Total Players: **${totalPlayers}**`)
        .setImage(imageUrl)
        .addFields(fields)
        .setColor("DarkGreen")
        .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({
            extension: "png",
            size: 256
            }),
        })
        .setTimestamp();

    

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("⚠️ Failed to fetch HQ stats.");
    }
  },
};