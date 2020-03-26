const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const prefix = "!";
const date = new Date();

async function getTop(subreddit) {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/top/.json?t=day?limit=1`);
    if (res.length == 0) {
        return false;
    } else {
        return response.data.data.children[0].data;
    }
}

async function getUser(user) {
    const response = await axios.get(`https://www.reddit.com/user/${name}/about.json`);
    if (response.length ==0) {
        return false;
    } else {
        return response.data.data
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
    if (msg.author.bot || msg.author.id == client.user.id) return;
    if (msg.content.startsWith(prefix)) {
        content = msg.content.substring(1, msg.content.length());
        if (content.startsWith('forcereddit')) {
            arguments = content.split(' ').splice(0, 1);
            if (!arguments.length == 1) return;
            postjson = getTop(arguments[0]);
            userjson = getUser(postjson.author);
            const embed = {
                "title": postjson.title,
                "description": `[Top of the Day at r/${postjson.subreddit}](https://www.reddit.com${postjson.permalink})`,
                "color": 16729344,
                "image": {
                    "url": postjson.url
                },
                "author": {
                    "name": postjson.author,
                    "url": `https://reddit.com/user/${postjson.author}`,
                    "icon_url": userjson.icon_img.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1')
                },
                "footer": {
                    "icon_url": "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon/120x120.png",
                    "text": "redd.it"
                },
                "timestamp": date.now()
            };
            msg.channel.send({embed});
        }
    };
})

client.login('NjgzNDc0NzQ0NzY2MzY1NzUw.Xnzzpw.Ead5FxIp5ujv2s07SyKOdjd8Brs');
