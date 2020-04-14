require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const sleep = (waitTimeInS) => new Promise(resolve => setTimeout(resolve, waitTimeInS * 1000)); // thx stackoverflow (Ryan Shillington)
const webtools = require('./tools.js');

const proc = process.env;
const prefix = proc.prefix == null ? "!" : proc.prefix;
const debug = proc.debug == null ? true : (proc.debug == 'true');
const token = proc.token == null ? undefined : proc.token



const commands = {
    'reddit': {
        'description': 'Gets reddit posts and displays them in an embed.',
        'method': async function(message) {
            var command_chunks = message.content.substring(prefix.length).split();
            if (command_chunks.length == 2) {
                message.channel.send(await getrembed(command_chunks[1], null))
            } else if (command_chunks.length == 3) {
                message.channel.send(await getrembed(command_chunks[1], command_chunks[2]))
            } else {
                message.channel.send('Too many arguments or invalid arguments!');
            }
        },
        'permissions': []
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', message => {
    if (message.author.id == client.user.id || message.author.bot) return;
    if (message.content.startsWith(prefix)) {
        var command_chunks = message.content.substring(prefix.length).split(' ');
        console.log(command_chunks);
        if (command_chunks[0] in commands) {
            try {
                let permissions = commands[command_chunks[0]].permissions;
                if (permissions.length > 0 && message.member != message.guild.owner) {
                    for (const permission in permissions) {
                        if (!message.member.hasPermission(permission)) return;
                        commands[command_chunks[0]].method(message);
                    }
                }
            }
            catch(err) {
                if (debug) console.error(err);
            }
        } 
    }
});

(async function login() {
    if (typeof(token) != undefined) {
        client.login(token).catch(err => {
            console.error('Token was found, but it was invalid.\n' + err);
            sleep(5);
            login()
        });
    } else {
        console.log('No token found in the process environment, is it misspelt?');
        sleep(5);
        login()
    }
})();
    