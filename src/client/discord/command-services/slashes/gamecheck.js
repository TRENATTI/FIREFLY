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

// ---------- HELPERS ----------

async function getUniverseId(placeId) {
  const res = await fetch(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
  );
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

// ---------- SERVER DATA WITH 429 REPORTING ----------

async function getServerData(placeIds) {
  const results = [];

  for (const place of placeIds) {
    if (!place.Active) continue;

    let cursor = null;
    let serverCount = 0;
    let playerCount = 0;
    let failed = false;

    try {
      do {
        let res;
        let retryCount = 0;

        while (true) {
          try {
            res = await fetch(
              `https://games.roblox.com/v1/games/${place.ID}/servers/Public?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ""}`
            );

            // ---- RATE LIMIT HANDLING ----
            if (res.status === 429) {
              retryCount++;

              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`429 on ${place.Name}, retrying in ${delay}ms...`);

              // after 3 failed retries, give up cleanly
              if (retryCount >= 3) {
                console.log(`Aborting ${place.Name} due to persistent 429`);
                failed = true;
                break;
              }

              await new Promise(r => setTimeout(r, delay));
              continue;
            }

            if (!res.ok) {
              console.log(`HTTP ${res.status} for ${place.Name}`);
              failed = true;
              break;
            }

            break;

          } catch (err) {
            console.log(`Fetch error for ${place.Name}`, err);
            failed = true;
            break;
          }
        }

        if (failed || !res) break;

        const json = await res.json();

        if (!json?.data) {
          failed = true;
          break;
        }

        serverCount += json.data.length;

        for (const server of json.data) {
          playerCount += server.playing;
        }

        cursor = json.nextPageCursor;

      } while (cursor && !failed);

      results.push({
        name: place.Name,
        servers: failed ? null : serverCount,
        players: failed ? null : playerCount,
        failed
      });

    } catch (err) {
      console.error(`Failed for ${place.Name}`, err);

      results.push({
        name: place.Name,
        servers: null,
        players: null,
        failed: true
      });
    }
  }

  return results;
}

// ---------- COMMAND ----------

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamecheck")
    .setDescription("Show servers and players across all places."),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      await noblox.setCookie(process.env.RBXCOOKIE);

      // ---- GAME INFO ----
      const universeId = await getUniverseId(PLACE_IDS[0].ID);

      let imageUrl = await getGameThumbnail(PLACE_IDS[0].ID);
      if (!imageUrl) {
        imageUrl = await getGameIcon(universeId);
      }

      const gameInfo = await noblox.getUniverseInfo([universeId]);

      // ---- SERVER DATA ----
      const serverData = await getServerData(PLACE_IDS);

      // ---- FILTER + SORT ----
      const activePlaces = serverData
        .filter(p => p.servers > 0 || p.failed)
        .sort((a, b) => (b.players || 0) - (a.players || 0));

      // ---- TOTAL PLAYERS ----
      const totalPlayers = serverData.reduce((sum, p) => sum + (p.players || 0), 0);

      // ---- EMBED FIELDS ----
      const fields = activePlaces.length > 0
        ? activePlaces.map(place => ({
            name: place.name,
            value: place.failed
              ? "⚠️ Unable to retrieve data (rate limited)"
              : `🟢 ${place.players} players\n🖥️ ${place.servers} servers`,
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
        .setDescription(
          `👥 Total Players: **${totalPlayers}**` +
          (serverData.some(p => p.failed) ? "\n⚠️ Some data was rate limited by Roblox." : "")
        )
        .setImage(imageUrl)
        .addFields(fields)
        .setColor("DarkGreen")
        .setFooter({
          text: interaction.guild?.name || "Unknown Server",
          iconURL: interaction.guild?.iconURL({
            extension: "png",
            size: 256
          }) || null,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("⚠️ Failed to fetch stats.");
    }
  },
};