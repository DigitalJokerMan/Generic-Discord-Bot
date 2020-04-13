require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const sleep = (waitTimeInS) => new Promise(resolve => setTimeout(resolve, waitTimeInS * 1000)); // thx stackoverflow (Ryan Shillington)

const proc = process.env;
const prefix = proc.prefix == null ? "!" : proc.prefix;
const debug = proc.debug == null ? true : (proc.debug == 'true');
const token = proc.token == null ? undefined : proc.token

async function getReddit(subreddit, arguments) {
    const reddit = 'https://www.reddit.com/';
    try {
        if (arguments.length == 0) {
            const postjs = await axios.get(reddit + `r/${subreddit}/top/.json?t=day`);
            const userjs = await axios.get(reddit + `user/${postjs.data.data.children[0].data.author}/about.json`);
            return [postjs.data.data.children[0].data, userjs.data.data];
        } else {
            const postjs = await axios.get(reddit + `r/${subreddit}/${arguments}`);
            const userjs = await axios.get(reddit + `user/${postjs.data.data.children[0].data.author}/about.json`);
            return [postjs.data.data.children[0].data, userjs.data.data];
        }
    }
    catch (err) {
        if (debug) console.error(err);
        return 'error';
    }
}

async function Image(url) {
    try {
        var promise = await axios.get(url)
        return (promise.headers['content-type'].startsWith('image/'));
    }
    catch (err) {
        if (debug) console.error(err);
        return 'error';
    }
}

const commands = {
    'reddit': {
        'description': 'Gets reddit posts and displays them in an embed.',
        'method': function(message) {

        },
        'permissions': []
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', message => {
    if (message.author.id == client.user.id || message.author.bot) return;
    if (message.content.StartsWith(prefix)) {
        var command_chunks = message.content.substring(prefix.length).split();
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
    