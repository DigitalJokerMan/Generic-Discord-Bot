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
        'description': 'Gets reddit posts and displays them in an embed.',
        'method': async function(message) {
            var command_chunks = message.content.substring(prefix.length).split(' ');
            message.channel.startTyping();
            switch (command_chunks.length) {
                case 2: {
                    tools.getRedditEmbed(command_chunks[1], null)
                        .then(embed => {
                            message.channel.send(embed).catch(err => {
                                if (debug) console.error(err);
                                message.channel.send('An unexpected error ocurred, most likely an invalid subreddit.');
                                return;
                            });
                            message.channel.stopTyping();
                            return;
                        })
                        .catch(err => {
                            if (debug) console.error(err);
                            message.channel.send('An unexpected error ocurred, most likely an invalid subreddit.');
                            return;
                        })
                    break;
                }
                case 3: {
                    tools.getRedditEmbed(command_chunks[1], command_chunks[2])
                        .then(embed => {
                            message.channel.send(embed).catch(err => {
                                if (debug) console.error(err);
                                message.channel.send('An unexpected error ocurred, most likely an invalid subreddit.');
                                return;
                            });
                            message.channel.stopTyping();
                            return;
                        })
                        .catch(err => {
                            if (debug) console.error(err);
                            message.channel.send('An unexpected error ocurred, most likely an invalid subreddit.');
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
        'permissions': []
    },
    'help': {
        'description': 'Lists all commands.',
        'method': function(message) {
            const embed = new Discord.MessageEmbed()
                .setTitle('List of all commands.')
                .setTimestamp(new Date().now)
            for (const command in commands) {
                const actual = commands[command];
                if (command != 'help') {
                    const newfield = {};
                    newfield.name = prefix + command;
                    newfield.value = actual.description
                    if (actual.permissions.length > 0) {
                        newfield.value += '\n**Required Permissions:**'
                        for (i=0; i<actual.permissions.length; i++) {
                            newfield.value += `\n   - ${actual.permissions[i].substring(0,1) + actual.permissions[i].toLowerCase().substring(1)}`
                        }
                    }
                    embed.addFields(newfield);
                }
            }

            message.channel.send({embed})
                .catch(err => {
                    if (debug) console.error(err);
                })
        },
        'permissions': []
    },
    'test': {
        'description': 'This is testing permissions',
        'method': function(message) {
            console.log(message.content)
        },
        'permissions': ['ADMINISTRATOR']
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
            try {
                let permissions = commands[command_chunks[0]].permissions;
                if (permissions.length > 0 && message.member != message.guild.owner) {
                    for (const permission in permissions) {
                        if (!message.member.hasPermission(permission)) return;
                    }
                    commands[command_chunks[0]].method(message);
                } else commands[command_chunks[0]].method(message);
            }
            catch(err) {
                if (debug) console.error(err);
            }
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
