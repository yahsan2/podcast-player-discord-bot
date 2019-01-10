process.on('unhandledRejection', console.dir);
require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();

client.login(process.env.DISCORD_BOT_KEY)

var connection = null
var dispatcher = null

client.on('ready', async () => {
  const channel = client.channels.get(process.env.DISCORD_CHANNEL_ID)
  
  if(channel){
    connection = await channel.join()    
  }
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (!message.guild) return;

  const [
    cmd, 
    arg1=null, 
    arg2=null
  ] = message.content.split(' ')
  
  if (cmd === '!podcast') {
    if(['stop', 'pause'].indexOf(arg1) > -1 && dispatcher) {      
      dispatcher.pause()
      return 
    }

    if (connection) {    
      dispatcher = connection.playStream(arg1)
      
      dispatcher.on('speaking', reason => {
        console.log(reason);
      });
    }    
  }
});