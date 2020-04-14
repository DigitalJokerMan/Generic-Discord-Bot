const axios = require('axios');
const Discord = require('discord.js');
const now = new Date().now;

const truncate = function(string, length) {
    return string.length <= length ? string : string.substring(0,length) + '...';
}

const isimg = async function(url) {
    try {
        var promise = await axios.get(url)
        return (promise.headers['content-type'].startsWith('image/'));
    }
    catch (err) {
        if (debug) console.error(err);
        return null;
    }
}

const getrembed = async function(subreddit, arguments) {
    const reddit = 'https://www.reddit.com';
    const split = arguments == null ? false : arguments.split('?');
    const embed = new Discord.MessageEmbed()
        .setColor(16729344)
        .setFooter('redd.it', 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png')
        .setTimestamp(now)
    try {
        if (split && split[0].endsWith('.json')) {
            if (split[0] != 'random.json') {
                const postjson = await axios.get(reddit + `/r/${subreddit}/${arguments}`);
                const pd = postjson.data.data.children[0].data;
                const userjson = await axios.get(reddit + `/user/${pd.author}/about.json`)
                const ud = userjson.data.data;
            } else if (split[0] == 'random.json') {
                const postjson = await axios.get(reddit + `/r/${subreddit}/${arguments}`);
                const pd = postjson.data[0].data.children[0].data;
                const userjson = await axios.get(reddit + `/user/${pd.author}/about.json`);
                const ud = userjson.data.data;
            } else return null;
        } else if (!split) {
            const postjson = await axios.get(reddit + `/r/${subreddit}/top.json?t=day`);
            const pd = postjson.data.data.children[0].data;
            const userjson = await axios.get(reddit + `/user/${pd.author}/about.json`);
            const ud = userjson.data.data;
        } else {
            return null;
        }
        embed.setTitle(pd.title)
        embed.setURL(reddit + pd.permalink)
        embed.setAuthor(pd.author, ud.icon_img, reddit + `/user/${pd.author}`)
        if (isimg(pd.url)) {embed.setImage(pd.url)} else if (isimg(pd.thumbnail)) embed.setThumbnail(pd.thumbnail);
        if (pd.selftext.length != 0) embed.setDescription(truncate(pd.selftext, 250));
        return embed;
    }
    catch (err) {
        if (debug) console.error(err);
        return null;
    }
}

module.exports = {
    truncate,
    getrembed,
    isimg
}