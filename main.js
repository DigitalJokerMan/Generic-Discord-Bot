require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const prefix = "!";
const date = Date.now();
var delay = 1000;
var lastCall = 0;

async function getUrl(url) {
    const r = await axios.get(url).catch(function (error) {
        if (error.response) {
            console.log("Requested URL: " + url + " | Status Code: " + error.response.status);
            return 'error';
        }
    })
    return r
}

async function getTop(subreddit) {
    const response = await getUrl(`https://www.reddit.com/r/${subreddit}/top/.json?t=day?limit=1`);
    if (response == 'error') {
        return 'error';
    } else {
        return response.data.data.children[0].data;
    }
}

async function getUser(user) {
    const response = await axios.get(`https://www.reddit.com/user/${user}/about.json`);
    if (response.length == 0) {
        return false;
    } else {
        return response.data.data
    }
}

function noPerms(channel) {
  embed = {
    "title": "Invalid permissions",
    "description": "You do not have the valid permissions to run this command.",
    "color": 16711680,
    "footer": {
      "text": "Generic Discord Bot"
    },
    "timestamp": date
  };
  channel.send({embed});
  return
}

function webError(channel) {
  embed = {
    "title": "Error catching website info.",
    "description": "That website (probably) doesn't exist, did you mistype it?\n\nIf you are using **!topoftheday**, this message will also appear if the reddit has no posts.",
    "color": 16711680,
    "footer": {
      "text": "Generic Discord Bot"
    },
    "timestamp": date
  };
  channel.send({embed});
  return
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
});

client.on('message', msg => {
    if (msg.author.bot || msg.author.id == client.user.id) return;
    console.log(lastCall)
    if (lastCall >= (Date.now() - delay)) return;
    lastCall = Date.now();
    if (msg.content.startsWith(prefix)) {
        var content = msg.content.substring(1, msg.content.length);
        var splitted = content.split(' ');
        var command = splitted[0].replace(/\s/g,'');
        switch (command) {
          case 'topoftheday':
            msg.channel.startTyping();
            if (splitted.length == 2) {
                async function dostuff() {
                  subreddit_json = await getTop(splitted[1]);
                  if (subreddit_json == 'error') {
                      webError(msg.channel);
                      return;
                  };
                  user_json = await getUser(subreddit_json.author);
                  embed = {
                    "title": subreddit_json.title,
                    "url": `https://reddit.com${subreddit_json.permalink}`,
                    "color": 16729344,
                    "footer": {
                      "icon_url": "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-120x120.png",
                      "text": "redd.it"
                    },
                    "author": {
                      "name": subreddit_json.author,
                      "url": `https://www.reddit.com/user/${subreddit_json.author}`,
                      "icon_url": user_json.icon_img.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1')
                    },
                    "timestamp": date
                  };
                  if (subreddit_json.url.match(/.(jpeg|jpg|gif|png)$/)) {
                      embed.image = new Object();
                      embed.image.url = subreddit_json.url;
                  } else {
                      if (subreddit_json.thumbnail.match(/.(jpeg|jpg|gif|png)$/)) {
                          embed.thumbnail = new Object();
                          embed.thumbnail.url = subreddit_json.thumbnail
                      }
                      if (!subreddit_json.url.startsWith(`https://www.reddit.com/${subreddit_json.subreddit_name_prefixed}/comments/`)) {
                          embed.fields = new Array();
                          embed.fields.push({
                              "name": "Included URL:",
                              "value": subreddit_json.url
                          });
                      }
                  };
                  if (subreddit_json.selftext != 'undefined' && subreddit_json.selftext.length != 0) {
                    if (subreddit_json.selftext.length > 300) {
                        embed.description = subreddit_json.selftext.substring(0, 300) + `.. [Read More](https://reddit.com${subreddit_json.permalink})`
                    } else {
                        embed.description = subreddit_json.selftext
                    }
                  };
                  msg.channel.send({embed});
                };
                dostuff().catch(function (error) {
                    webError(msg.channel);
                });
              } else {
                embed = {
                  "title": "Invalid arguments!",
                  "description": `**${content}** has an invalid number of arguments. Proper usage: !topoftheday (subredditname)`,
                  "color": 16720932,
                  "footer": {
                    "text": "Hal8k - Discord Bot"
                  },
                  "timestamp": date
                };
                msg.channel.send({embed});
            }
            break;
          default:
            console.log(`${msg.member.user.tag} tried to call a command with ${prefix}${command} but no matching command was found.`)
            break;
        };
        msg.channel.stopTyping();
    };
});

client.login(process.env.token);
