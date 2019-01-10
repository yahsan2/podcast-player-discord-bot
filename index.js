process.on('unhandledRejection', console.dir);
require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();

client.login(process.env.DISCORD_BOT_KEY)

var connection = null

client.on('ready', async () => {
  const channel = client.channels.get(process.env.DISCORD_CHANNEL_ID)
  
  if(channel){
    connection = await channel.join()    
  }
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (!message.guild) return;

  if (connection) {    
    const dispatcher = connection.playStream('http://cdn.rebuild.fm/audio/podcast-ep224a.mp3')
    
    dispatcher.on('speaking', reason => {
      console.log(reason);
    });
  }
});