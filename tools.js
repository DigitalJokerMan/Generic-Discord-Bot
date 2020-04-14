require('dotenv').config();

const axios = require('axios');
const Discord = require('discord.js');
const now = new Date().now;
const reddit = 'https://www.reddit.com';

const proc = process.env;
const prefix = proc.prefix == null ? "!" : proc.prefix;
const debug = proc.debug == null ? true : (proc.debug == 'true');
const token = proc.token == null ? undefined : proc.token

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

const construct = async function(postdata, userdata) {
    const embed = new Discord.MessageEmbed()
        .setColor(16729344)
        .setFooter('redd.it', 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png')
        .setTimestamp(now)
        .setTitle(postdata.title)
        .setURL(reddit + postdata.permalink)
        .setAuthor(postdata.author, userdata.icon_img.split('?')[0], reddit + `/user/${postdata.author}`)
    if (isimg(postdata.url)) {embed.setImage(postdata.url)} else if (isimg(postdata.thumbnail)) embed.setThumbnail(postdata.thumbnail);
    if (postdata.selftext.length != 0) embed.setDescription(truncate(postdata.selftext, 250));
    return embed
}

const getrembed = async function(subreddit, arguments) {
    const split = arguments == null ? false : arguments.split('?');
    if (split && split[0].endsWith('.json')) {
        if (split[0] != 'random.json') {
            axios.get(reddit + `/r/${subreddit}/${arguments}`)
                .then(postpromise => {
                    const postdata = postpromise.data.data.children[0].data;
                    axios.get(reddit + `/user/${postdata.author}/about.json`).then((postdata, userpromise) => {
                        return construct(postdata, userpromise.data.data);
                    })
                })
                .catch(err => {
                    if (debug) console.error(err);
                    return null;
                })
        } else if (split[0] == 'random.json') {
            axios.get(reddit + `/r/${subreddit}/${arguments}`)
                .then(postpromise => {
                    const postdata = postpromise.data[0].data.children[0].data;
                    axios.get(reddit + `/user/${postdata.author}/about.json`).then((postdata, userpromise) => {
                        return construct(postdata, userpromise.data.data);
                    })
                })
                .catch(err => {
                    if (debug) console.error(err);
                    return null;
                })
        } else return null;
    } else if (!split) {
        axios.get(reddit + `/r/${subreddit}/top.json?t=day`)
                .then(postpromise => {
                    const postdata = postpromise.data[0].data.children[0].data;
                    axios.get(reddit + `/user/${postdata.author}/about.json`).then((postdata, userpromise) => {
                        return construct(postdata, userpromise.data.data);
                    })
                })
                .catch(err => {
                    if (debug) console.error(err);
                    return null;
                })
    }
}

module.exports = {
    construct,
    truncate,
    getrembed,
    isimg
}