process.on('unhandledRejection', console.dir);
require('dotenv').config()

const rssChannels = require('./rss.json');
const channelKeys = Object.keys(rssChannels)

const Discord = require('discord.js');
const client = new Discord.Client();
const xml2js = require('xml2js')
const axios = require('axios')

var textChannel = null
var voiceChannel = null
var connection = null
var dispatcher = null
var currentEpisode = null
var feedItems = []
var isStoped = false


const setEpisode = async (podcastChannel, epi)=> {
  const feed = podcastChannel.feed
  const { data } = await axios.get(feed).catch(console.dir)
  const xmlObj = await parseXml(data)
  
  feedItems = xmlObj.rss.channel.item
  currentEposode = feedItems[epi ? feedItems.length - epi : 0]
}

const playEpisode = async (arg1, arg2)=> {
  const key = arg1 === 'random' ? channelKeys[Math.floor(Math.random() * channelKeys.length)] : arg1;

  connection = await voiceChannel.join()    

  isStoped = false
  if(key === 'mp3') {
    dispatcher = connection.playStream(arg2)
  } else if(rssChannels[key]){
    await setEpisode( rssChannels[key], arg2)    
    if (currentEposode.enclosure) {
      console.log(currentEposode.enclosure.$.url)
      dispatcher = connection.playStream(currentEposode.enclosure.$.url)
    } else {
      textChannel.send(`指定のポッドキャストの feed が正しくありません`)
      return 
    }
  } else {
    textChannel.send(`指定のポッドキャストが見つかりません`)
    return
  }
  textChannel.send(`${currentEposode.title} ${rssChannels[key].hashtag}\n${currentEposode.link}`)

  dispatcher.on('speaking', speaking => {
    console.log('speaking', speaking) 
  })
  dispatcher.on('end', reason => {
    connection.disconnect()    
    if (!isStoped && process.env.IS_INFINITY) {
      playEpisode('random')      
    }
  });  
}

const parseXml = (xml)=>{
  return new Promise((resolve, reject)=>{
    xml2js.parseString(xml, {explicitArray: false}, (err, json)=> {
      if(err) reject(err)
      else resolve(json)
    })
  })
}

client.login(process.env.DISCORD_BOT_KEY)

client.on('ready', async () => {
  textChannel = client.channels.get(process.env.DISCORD_TEXT_CHANNEL_ID)
  voiceChannel = client.channels.get(process.env.DISCORD_CHANNEL_ID)
  if(process.env.IS_INFINITY){
    await playEpisode('random')
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
  
  if (cmd === '!podcast' && message.channel.id === process.env.DISCORD_TEXT_CHANNEL_ID) {
    if(['list'].indexOf(arg1) > -1) {
      const list = channelKeys.map( key => {
        return `${key}: ${rssChannels[key].hashtag || ''}`
      }).join('\n')      
      textChannel.send(list)
      return 
    }
    if(['stop', 'pause'].indexOf(arg1) > -1 && dispatcher) {      
      isStoped = true
      dispatcher.end()
      textChannel.send(`${currentEposode.title}を \`${dispatcher.time}\` で止めました`)
      return 
    }
    playEpisode(arg1, arg2)
  }
});