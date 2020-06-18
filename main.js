require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const tools = require('./tools.js');
const imgur = require('imgur');
const axios = require('axios');
const ytdl = require('ytdl-core-discord');
const proc = process.env;
const prefix = proc.prefix == null ? "!" : proc.prefix;
const debug = proc.debug == null ? true : (proc.debug == 'true');
const token = proc.token
var queue = []
var queue_playing = false;

const range = (min, max) => Math.random() * (max-min+1) + min;
const chance = (percent) => range(0, 100) <= percent;

async function getFlowData(session_id) {
    const newFlow = await axios.get(`https://inspirobot.me/api?generateFlow=1&sessionID=${session_id}`);
    const flowData = newFlow.data;

    return {mp3: flowData.mp3, duration: flowData.data[flowData.data.length-1].time+1}
};

async function dispatchFlow(connection, session_id, lastTick) {
    const flowData = await getFlowData(session_id);
    const dispatcher = connection.play(flowData.mp3);

    dispatcher.on('finish', () => {
        setTimeout(async function() { await dispatchFlow(connection, session_id, (new Date()).getTime()) }, lastTick+flowData.duration - (new Date()).getTime())
    });
}

async function play(connection) {
    var song; 
    try { song = await ytdl(queue[0]); }
    catch (err) {
        console.error(err);
        queue.splice(0,1);
        play(connection);
        return;
    }
    const dispatcher = connection.play(song, {type: 'opus'});
    dispatcher.on('finish', async () => {
        queue.splice(0,1);
        if (queue[0]) {
            play(connection);
        } else {
            queue_playing = false;
            connection.channel.leave();
            return;
        }
    });
}

const commands = {
    'reddit': {
        description: '*Usage*: ``reddit (subreddit) (optional: custom JSON)``\nGets reddit posts and\ndisplays them in an embed.',
        method: async function(message) {
            var command_chunks = message.content.substring(prefix.length).split(' ');
            switch (command_chunks.length) {
                case 2: {
                    tools.getRedditEmbed(command_chunks[1], null)
                        .then(embed => {
                            message.channel.send(embed).catch(err => {
                                if (debug) console.error(err);
                                message.channel.send('An unexpected error ocurred, most likely an invalid subreddit. (I\'m too lazy to make this command more fail-proof)');
                                return;
                            });
                            return;
                        })
                        .catch(err => {
                            if (debug) console.error(err);
                            message.channel.send('An unexpected error ocurred, most likely an invalid subreddit. (I\'m too lazy to make this command more fail-proof)');
                            return;
                        })
                    break;
                }
                case 3: {
                    tools.getRedditEmbed(command_chunks[1], command_chunks[2])
                        .then(embed => {
                            message.channel.send(embed).catch(err => {
                                if (debug) console.error(err);
                                message.channel.send('An unexpected error ocurred, most likely an invalid subreddit. (I\'m too lazy to make this command more fail-proof)');
                                return;
                            });
                            return;
                        })
                        .catch(err => {
                            if (debug) console.error(err);
                            message.channel.send('An unexpected error ocurred, most likely an invalid subreddit. (I\'m too lazy to make this command more fail-proof)');
                            return;
                        })
                    break;
                }
                default: {
                    message.channel.send('Too many, too little, or invalid arguments.');
                    break;
                }
            }
            return;
        },
        permissions: []
    },
    'help': {
        description: 'Lists all commands.',
        method: function(message) {
            const embed = new Discord.MessageEmbed()
                .setTitle('List of all commands.')
                .setTimestamp()
                .setColor('#ff0a0a')
                .setThumbnail('https://cdn.discordapp.com/avatars/693646279720566854/fe72094e62bcdda7b7a627af9611c8ee.png?size=256')
            for (const command in commands) {
                const actual = commands[command];
                if (command != 'help') {
                    if (actual.permissions.length > 0) {
                        if (actual.permissions.every((perm) => message.member.hasPermission(perm)) || message.member == message.guild.owner) {
                            const field = new Object();
                            field.name = prefix + command;
                            field.value = actual.description
                            embed.addFields(field);
                        } else if (embed.description == undefined || typeof(embed.description) == undefined) {
                            embed.setDescription('*Some commands weren\'t shown because you don\'t\n have the permissions to run them.*')
                        }
                    } else {
                        const field = new Object();
                        field.name = prefix + command;
                        field.value = actual.description;
                        embed.addFields(field);
                    }
                }
            }

            message.channel.send({embed})
                .catch(err => {
                    if (debug) console.error(err);
                })
        },
        permissions: []
    },
    'test': {
        description: 'This is testing command to check if permissions are checked properly, and to see if they are properly shown in the help command.\nWhat this command actually does will probably vary.',
        method: function(message) {
            console.log(message.content)
        },
        permissions: ['ADMINISTRATOR', 'MANAGE_ROLES', 'NON_EXISTANT_PERM']
    }, 
    'everyone': {
        description: 'lol',
        method: function(message) {
            const members = message.guild.members.cache;
            const array = members.array();
            var msg = new String();
            if (message.content.split(' ').length > 1) {
                if (message.content.indexOf('"') != -1) {
                    const beginningIndex = message.content.indexOf('"');
                    if (message.content.indexOf('"', beginningIndex+1) != -1) {
                        const endingIndex = message.content.indexOf('"', beginningIndex+1);
                        const extramsg = message.content.substring(beginningIndex+1, endingIndex);
                        console.log(extramsg);
                        msg += `${extramsg} (Courtesy of ${message.author.username})`;
                    }
                }
            }
            msg += '\n';
            for (i=0; i<array.length; i++) {
                if (array[i].user) {
                    if(!array[i].user.bot) {
                        msg += `<@${array[i].user.id}> `;
                    }
                }
            }
            console.log(msg);
            message.channel.send(msg).then(msg => msg.delete());
        },
        permissions: []
    },
    'inspire': {
        description: 'Gives you an AI-generated inspirational quote.\n[Generated at inspirobot.me, check them out!](https://inspirobot.me/)',
        method: async function(message) {
            var req = await axios.get('https://inspirobot.me/api?generate=true')
            message.channel.send(`<@${message.author.id}>\n`+req.data)
        },
        permissions: []
    },
    'mindfulness': {
        description: '**You need to be in a VC.** Says various sentences to you, in order to keep you mindful. (Don\'t ask me what that means, idfk.)\n[Generated at inspirobot.me, check them out!](https://inspirobot.me/)',
        method: async function(message) {
            if (message.member.voice && message.member.voice.channel) {
                try {
                    if (!queue_playing) {
                        const vc = message.member.voice.channel;
                        const session_req = await axios.get('https://inspirobot.me/api?getSessionID=1');
                        const session_id = session_req.data;
                        vc.join().then(async (connection) => {
                            dispatchFlow(connection, session_id, (new Date()).getTime()).catch(err => {
                                console.error(err);
                            });
                        });
                    } else {
                        message.channel.send('This would interrupt the currently playing queue, pls no.')
                    }
                }
                catch (err) {
                    console.error(err);
                }
            } else {
                message.channel.send('You are not connected to a VC.');
            }
        },
        permissions: []
    },
    'stopvc': {
        description: 'Stops the bot from being mindful. (Disconnects the bot from the VC.)',
        method: function (message) {
            const voiceState = message.guild.voice;
            try {
                if (voiceState && voiceState.connection && voiceState.connection.channel) {
                    voiceState.connection.channel.leave();
                    if (queue_playing) {queue_playing = false};
                }
            }
            catch (err) {
                console.error(err);
            }
        },
        permissions: []
    },
    'sonic': {
        description: 'fast zoom vrrrrr',
        method: function (message) {
            message.channel.send({files: ["./sonic.gif"]})
        },
        permissions: []
    },
    'playmusic': {
        description: 'Plays a youtube video in your VC.',
        method: async function(message) {
            var command_chunks = message.content.split(' ');
            var proper_link = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
            try {
                if (command_chunks[1] && typeof(command_chunks[1]) == 'string' && proper_link.test(command_chunks[1])) {
                    if (message.member.voice) {
                        queue.push(command_chunks[1])
                        message.channel.send(`Added ${command_chunks[1]} to queue.`);
                        if (!queue_playing) {
                            queue_playing = true;
                            message.member.voice.channel.join().then(async (connection) => {
                                play(connection)
                            })
                        }
                    } else {
                        message.channel.send('You are not in a voice channel.')
                    }
                } else {
                    message.channel.send('You did not include a youtube link. (The youtube link should be the first and only argument.)');
                }
            }
            catch (err) {
                console.error(err);
            }
        },
        permissions: []
    },
    'thanosdance': {
        description: 'thanos lowkey hot, i\'d fuck him!',
        method: function(message) {
            message.channel.send({files: ["./thanos.gif"]})
        },
        permissions: []
    },
    'allah': {
        description: '#meirl',
        method: function(message) {
            message.channel.send('https://cdn.discordapp.com/attachments/429374154093887506/723011524154622044/image0-7.gif')
        },
        permissions: []
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', message => {
    if (message.author.id == client.user.id || message.author.bot) return;
    if (message.content.startsWith(prefix)) {
        var command_chunks = message.content.substring(prefix.length).split(' ');
        if (command_chunks[0] in commands) {
            if (command_chunks[0] != 'playmusic') {
                try {
                    let permissions = commands[command_chunks[0]].permissions;
                    if (permissions.length > 0 && message.member != message.guild.owner) {
                        if (actual.permissions.every((perm) => message.member.hasPermission(perm))) commands[command_chunks[0]].method(message); 
                    } else commands[command_chunks[0]].method(message);
                }
                catch(err) {
                    if (debug) console.error(err);
                }
            } else {
                message.channel.send('This command is disabled.');
            }
        } 
    }
//    if (message.author.id != 159985870458322944) {
//        try {
//            var embeds = message.embeds.filter(embed => embed.provider && embed.provider.name == 'YouTube');
//            if (embeds[0]) {
//                message.delete().then(message => {
//                    const me = message.guild.member(client.user.id);
//                    var content = message.content;
//                    
//                    for (var i=0; i<embeds.length; i++) {
//                        var content = content.replace(embeds[i].url, "https://www.youtube.com/watch?v=ST7DxZrwkRw")
//                    }
//
//                    me.setNickname(message.member.displayName).then(() => {
//                        message.channel.send(content).then(() => {
//                            me.setNickname(client.user.username)
//                        });
//                    });
//                })
//           }
//        }
//        catch (err) {
//            console.error(err);
//        }
//    }
    if (chance(.1)) {
        imgur.search('cursed images', {sort: 'time', dateRange: 'all', page: 1})
            .then(json => {
                const data = json.data;
                const keys = Object.keys(data);
                message.channel.send(`<@${message.author.id}> `+'Thought you needed some motivation, here\'s some cool shit I found.\n'+data[`${Math.floor(range(0, keys.length-1))}`].images[0].link)
            })
            .catch(err => {
                console.error(err)
            })
    }
});

(function checkvc() {

})();

(function login() {
    if (typeof(token) == undefined || token == undefined) {
        console.log('There isn\'t an entry in process environment named token, retrying in 5 seconds.');
        setTimeout(login, 5000);
    } else client.login(token).catch(err => {
        if (debug) console.error(err);
        console.log('Given token is invalid, retrying in 5 seconds.');
        setTimeout(login, 5000);
    });
})();
