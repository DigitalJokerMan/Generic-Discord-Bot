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
        'description': '*Usage*: ``reddit (subreddit) (optional: arguments)``\nGets reddit posts and\ndisplays them in an embed.',
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
                .setTimestamp()
                .setColor('#ff0a0a')
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
                            embed.setDescription('Some commands weren\'t shown because you don\'t have the permissions to run them.')
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
        'permissions': []
    },
    'test': {
        'description': 'This is testing command to check if permissions are checked properly, and to see if they are properly shown in the help command.\nWhat this command actually does will probably vary.',
        'method': function(message) {
            console.log(message.content)
        },
        'permissions': ['ADMINISTRATOR', 'MANAGE_ROLES', 'NON_EXISTANT_PERM']
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
                    if (actual.permissions.every((perm) => message.member.hasPermission(perm))) commands[command_chunks[0]].method(message);
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
