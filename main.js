require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const date = Date.now();
const validcommands = [
    "topoftheday",
    "customreddit",
    "help"
]

let prefix = process.env.prefix;

async function redditGet(subreddit, iscustom, arguments) {
    try {
        if (iscustom == false) {
            const postjs = await axios.get(`https://www.reddit.com/r/${subreddit}/top/.json?t=day?limit=1`);
            const userjs = await axios.get(`https://www.reddit.com/user/${postjs.data.data.children[0].data.author}/about.json`);
            return [postjs.data.data.children[0].data, userjs.data.data]
        } else if (iscustom == true && arguments != 'undefined') {
            const postjs = await axios.get(`https://www.reddit.com/r/${subreddit}/${arguments}`);
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
        console.error(err);
        return 'error'
    }
}

async function isImage(url) {
    try {
        var promise = await axios.get(url);
        if (promise.headers['content-type'].startsWith('image/')) return true;
        return false;
    }
    catch (err) {
        console.error(err);
        return false;
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
                            console.log(post.thumbnail);
                            embed.thumbnail.url = post.thumbnail;
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
                        console.error(err);
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
                              embed.thumbnail = new Object();
                              console.log(post.thumbnail);
                              embed.thumbnail.url = post.thumbnail;
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
                          console.error(err);
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
