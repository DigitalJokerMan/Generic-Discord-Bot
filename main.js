require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const prefix = "!";
const date = Date.now();
const {promisify} = require('util');
const sleep = promisify(setTimeout);

async function getTop(subreddit) {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/top/.json?t=day?limit=1`);
    if (response.length == 0) {
        return false;
    } else {
        return response.data.data.children[0].data;
    }
}

async function getUser(user) {
    const response = await axios.get(`https://www.reddit.com/user/${user}/about.json`);
    if (response.length ==0) {
        return false;
    } else {
        return response.data.data
    }
}

function noPerms(channel) {
  embed = {
    "title": "Invalid permissions",
    "description": "You do not have the valid permissions to run this command.",
    "footer": {
      "text": "Generic Discord Bot"
    },
    "timestamp": date
  };
  channel.send({embed});
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
});

client.on('message', msg => {
    if (msg.author.bot || msg.author.id == client.user.id) return;
    if (msg.content.startsWith(prefix)) {
        var content = msg.content.substring(1, msg.content.length);
        var splitted = content.split(' ');
        var command = splitted[0].replace(/\s/g,'');
        switch (command) {
          case 'topoftheday':
            if (splitted.length == 2) {
                async function dostuff() {
                  subreddit_json = await getTop(splitted[1]);
                  user_json = await getUser(subreddit_json.author);
                  embed = {
                    "title": subreddit_json.title,
                    "url": `https://reddit.com${subreddit_json.permalink}`,
                    "color": 16729344,
                    "image": {
                      "url": subreddit_json.url
                    },
                    "footer": {
                      "icon_url": "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon/120x120.png",
                      "text": "redd.it"
                    },
                    "author": {
                      "name": subreddit_json.author,
                      "url": `https://www.reddit.com/user/${subreddit_json.author}`,
                      "icon_url": user_json.icon_img.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1')
                    },
                    "timestamp": date
                  };
                  msg.channel.send({embed});
                };
                dostuff()
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
                break;
            }
          case 'reboot':
            if(!msg.member.hasPermission(['ADMINISTRATOR']) || msg.author.id != 110137532972314624) noPerms(msg.channel);
            msg.delete();
            msg.channel.send('Rebooting..').then(msg => {
              client.destroy();
              client.login(process.env.token).then(() => {
                msg.delete();
                msg.channel.send("Completed!").then(async () => {
                  await sleep(2500);
                  msg.delete();
                });
              });
            })
          default:
            console.log(`${msg.member.user.tag} tried to call a command with ${prefix}${command} but no matching command was found.`)
            break;
        };
    };
});

client.login(process.env.token);
