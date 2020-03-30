require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
let prefix = process.env.prefix;
const date = Date.now();
const validcommands = [
    "topoftheday",
    "customreddit",
    "help"
]

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

async function getCustom(subreddit, custom) {
    let response = await getUrl(`https://www.reddit.com/r/${subreddit}/${custom}`);
    if (response == 'error') {
        return 'error';
    } else {
        if (Object.prototype.toString.call(response.data) === '[object Array]') {
            return response.data[0].data.children[0].data;
        } else {
            return response.data.data.children[0].data;
        }
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
    "description": `That website (probably) doesn't exist, did you mistype it?\n\nIf you are using **${prefix}topoftheday** or **${prefix}customreddit**, this message will also appear if the reddit has no posts. In ${prefix}customreddit's case, it is most likely you wrote the arguments wrong. (I guess you can blame me.)`,
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
    if (msg.content.startsWith(prefix)) {
        var content = msg.content.substring(prefix.length, msg.content.length);
        var splitted = content.split(' ');
        var command = splitted[0].replace(/\s/g,'');
        if (validcommands.includes(command)) {
            msg.channel.startTyping();
            switch (command) {
              case 'topoftheday':
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
                        console.log(error)
                    });
                  } else {
                    embed = {
                      "title": "Invalid arguments!",
                      "description": `**${content}** has an invalid number of arguments. Proper usage: ${prefix}topoftheday (subredditname)`,
                      "color": 16720932,
                      "footer": {
                        "text": "Hal8k - Discord Bot"
                      },
                      "timestamp": date
                    };
                    msg.channel.send({embed});
                }
                break;
              case 'customreddit':
                  if (splitted.length == 3) {
                      async function dostuff() {
                        subreddit_json = await getCustom(splitted[1], splitted[2]);
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
                          console.log(error)
                      });
                    } else {
                      embed = {
                        "title": "Invalid arguments!",
                        "description": `**${content}** has an invalid number of arguments. Proper usage: ${prefix}customreddit (subredditname) (custom json, Ex: /top/.json?top=day)`,
                        "color": 16720932,
                        "footer": {
                          "text": "Hal8k - Discord Bot"
                        },
                        "timestamp": date
                      };
                      msg.channel.send({embed});
                  }
                break;
              case 'help':
                embed = {
                    "title": "Available commands",
                    "description": "This is a list of the commands currently available, it is possible some may require permissions you do not have.\n",
                    "footer": {
                        "text": "Generic Discord Bot"
                    },
                    "timestamp": date,
                    "color": 5963612,
                    "fields": [
                        {
                            "name": `${prefix}topoftheday`,
                            "value": `Gets the top post of the day on desired subreddit. \n **Usage**: ${prefix}topoftheday (subreddit)`
                        },
                        {
                            "name": `${prefix}customreddit`,
                            "value": `Gets a reddit post with the provided arguments. \n **Usage**: ${prefix}customreddit (subreddit) (args)\n**Ex**: ${prefix}customreddit funny top/.json?t=day (This would return the same thing as ${prefix}topoftheday, if given reddit was r/funny.)`
                        }
                    ]
                };
                msg.channel.send({embed})
                break;
              default:
                console.log(`${msg.member.user.tag} tried to call a command with ${prefix}${command} but no matching command was found.`)
                break;
            };
        } else {
            console.log(`${msg.member.user.tag} tried to call a command with ${prefix}${command} but no matching command was found.`)
        }
        msg.channel.stopTyping();
    };
});

client.login(process.env.token);
