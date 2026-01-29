require("dotenv").config();

const { Client, GatewayIntentBits, AuditLogEvent } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

const LOG_CHANNEL_ID = "1466246729463501005";
const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/\S+/i;


function sendLog(guild, text) {
  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (channel) channel.send(text);
}

client.once("ready", () => {
  console.log("Bot działa");
});

client.on("messageCreate", async message => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const match = message.content.match(INVITE_REGEX);
  if (!match) return;

  const link = match[0];

  try {
    await message.delete();
  } catch (e) {
    return;
  }

  sendLog(
    message.guild,
    `🚫 **Antylink**
Autor: ${message.author.tag}
Kanał: ${message.channel}
Link: ${link}`
  );
});

/* USUWANIE WIADOMOŚCI */
client.on("messageDelete", msg => {
  if (!msg.guild || msg.author?.bot) return;

  sendLog(
    msg.guild,
    `🗑️ Usunięta wiadomość
Autor: ${msg.author.tag}
Kanał: ${msg.channel}
Treść: ${msg.content || "brak"}`
  );
});

/* EDYCJA WIADOMOŚCI */
client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;

  sendLog(
    oldMsg.guild,
    `✏️ Edytowana wiadomość
Autor: ${oldMsg.author.tag}
Kanał: ${oldMsg.channel}
Przed: ${oldMsg.content}
Po: ${newMsg.content}`
  );
});

/* BAN */
client.on("guildBanAdd", async ban => {
  const logs = await ban.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberBanAdd,
    limit: 1
  });

  const entry = logs.entries.first();

  sendLog(
    ban.guild,
    `🔨 Ban
Użytkownik: ${ban.user.tag}
Admin: ${entry?.executor?.tag || "nieznany"}`
  );
});

/* TIMEOUT */
client.on("guildMemberUpdate", async (oldM, newM) => {
  if (!oldM.communicationDisabledUntil && newM.communicationDisabledUntil) {
    const logs = await newM.guild.fetchAuditLogs({
      type: AuditLogEvent.MemberUpdate,
      limit: 1
    });

    const entry = logs.entries.first();

    sendLog(
      newM.guild,
      `🔇 Timeout
Użytkownik: ${newM.user.tag}
Moderator: ${entry?.executor?.tag || "nieznany"}
Do: ${newM.communicationDisabledUntil}`
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
