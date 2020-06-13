require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const tools = require('./tools.js');

const proc = process.env;
const prefix = proc.prefix == null ? "!" : proc.prefix;
const debug = proc.debug == null ? true : (proc.debug == 'true');
const token = proc.token

const commands = {
    'reddit': {
        description: '*Usage*: ``reddit (subreddit) (optional: arguments)``\nGets reddit posts and\ndisplays them in an embed.',
        method: async function(message) {
            var command_chunks = message.content.substring(prefix.length).split(' ');
            message.channel.startTyping();
            switch (command_chunks.length) {
                case 2: {
                    tools.getRedditEmbed(command_chunks[1], null)
                        .then(embed => {
                            message.channel.send(embed).catch(err => {
                                if (debug) console.error(err);
                                message.channel.send('An unexpected error ocurred, most likely an invalid subreddit. (I\'m too lazy to make this command more fail-proof)');
                                return;
                            });
                            message.channel.stopTyping();
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
                            message.channel.stopTyping();
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
                    message.channel.stopTyping();
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
        'description': 'lol',
        'method': function(message) {
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
        'permissions': []
    }
}

function fix_nicknames(guilds, guildid) {
    const guild = guilds.find(guild => guild.id == guildid)
    var members = guild.members.cache.array().filter(member => !/^[ -~]*$/.test(member.nickname))
    for (const member of members) {
        if (!member.bot && member.nickname) {
            member.setNickname("Invisible Simp")
        }
    }
}

client.on('ready', () => {
    const guilds = client.guilds.cache.array()
    console.log(`Logged in as ${client.user.tag}`);
    //setInterval(function() { fix_nicknames(guilds, 426878606783021056); }, 10)
});

client.on('message', message => {
    if (message.author.id == client.user.id || message.author.bot) return;
    if (message.content.startsWith(prefix)) {
        var command_chunks = message.content.substring(prefix.length).split(' ');
        if (command_chunks[0] in commands) {
            try {
                let permissions = commands[command_chunks[0]].permissions;
                if (permissions.length > 0 && message.member != message.guild.owner) {
                    if (actual.permissions.every((perm) => message.member.hasPermission(perm))) commands[command_chunks[0]].method(message);
                } else commands[command_chunks[0]].method(message);
            }
            catch(err) {
                if (debug) console.error(err);
            }
        } 
    }
    if (message.author.id != 159985870458322944) {
        var embeds = message.embeds.filter(embed => embed.url.includes('youtube.com') || embed.url.includes('youtu.be'));
        if (embeds.length > 0) {
            var content = message.content
            for (const embed of embeds) {
                content.replace(embed.url, "https://www.youtube.com/watch?v=ST7DxZrwkRw");
            }
            message.delete().then(message => {
                message.channel.send(content);
            })
        }
    }
});

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
