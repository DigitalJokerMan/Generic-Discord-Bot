const axios = require('axios');
const Discord = require('discord.js');

const getrembed = async function(subreddit, arguments) {
    const reddit = 'https://www.reddit.com/';
    const split = arguments == null ? false : arguments.split('?');
    const embed = new Discord.MessageEmbed();
    if (split && !split[0].endsWith('.json')) {

    } else {
        const postjson = await axios.get(reddit + `r/${subreddit}/top.json?t=day`);
        const userjson = await axios.get(reddit + `user/${postjson.data.data.children[0]}`)
    }

}

const isimg = async function Image(url) {
    try {
        var promise = await axios.get(url)
        return (promise.headers['content-type'].startsWith('image/'));
    }
    catch (err) {
        if (debug) console.error(err);
        return null;
    }
}

module.exports = {
    getrembed,
    isimg
}