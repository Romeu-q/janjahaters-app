// Bot de exemplo feito com a biblioteca oficial do Stoat (stoat.js). Nada aqui é do janja:
// só o endereço (baseURL) aponta para o janja-bot-gateway em vez do stoat.chat.
//
//   npm install stoat.js
//   JANJA_BOT_TOKEN=... node exemplo-ping.mjs
import { Client } from 'stoat.js';

const client = new Client({ baseURL: process.env.STOAT_API || 'http://127.0.0.1:14700' });

client.on('ready', () => {
  console.log(`Logado como ${client.user.displayName ?? client.user.username}`);
  console.log('Canais:', client.channels.toList().map((c) => c.name).join(', '));
});

client.on('messageCreate', async (message) => {
  if (message.authorId === client.user.id) return;
  const text = message.content?.trim() ?? '';
  if (text === '!ping') {
    await message.react('🏓');
    await message.reply('pong!');
  } else if (text === '!quem') {
    const author = client.users.get(message.authorId);
    await message.channel.sendMessage(`Você é ${author?.displayName ?? author?.username}. Tem ${client.users.size()} pessoas no grupo.`);
  } else if (text.startsWith('!diga ')) {
    await message.channel.sendMessage({ content: text.slice(6), embeds: [{ title: 'Recado', description: 'mandado pelo bot' }] });
  }
});

client.on('messageReactionAdd', (message, userId, emoji) => console.log(`${userId} reagiu ${emoji}`));

client.loginBot(process.env.JANJA_BOT_TOKEN);
