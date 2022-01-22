const Discord = require('discord.js');
const Sequelize = require('sequelize');
const config = require('./config.json');
const listFilters = require('./FilterList.json');
const logChannels = require('./LogChannels.json');
const songList = require('./Songs.json');
const songlist = songList.songs;
const playList = './saves/songs/';
const client = new Discord.Client();
const usrtest = new Discord.UserManager();
const ytdl = require('ytdl-core');
var last5songs = [-1, -1, -1, -1, -1];
var lsIndex = 0;
var forceLeave = false;
var currentsong = -1;
var publicConnection;
var vc;
//
const logchannels = logChannels.channels;
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});
const illegalWords = listFilters.list;
//
var date = new Date();
const Data = sequelize.define('data', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    contents: Sequelize.STRING,
});
//
const Settings = sequelize.define('settings', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    contents: Sequelize.STRING,
});
//
client.once('ready', () => {
    Data.sync();
    Settings.sync();
});
//
client.on('ready', () => {
    console.clear();
    console.log(`System Status: ONLINE!`);
    console.log(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}`);
});
//
client.login(config.token);
//
function getRndInteger(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}
client.on('message', async message => {
    var allowedUserNames = [];
    const admins = await Data.findOne({ where: { name: 'admins' } });
    async function LogCMD(command, isError, subCommand) {
        const logData = await Settings.findOne({ where: { name: 'log' } });
        const logValue = logData.get('contents');
        if (!isError) {
            if (subCommand != null) {
                console.log(`System Call: System ${command}: ${subCommand}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`);
            } else {
                console.log(`System Call: System ${command}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`);
            }
			if (logValue == 'log') {
				for (var i = 0; i < logchannels.length; i++) {
                client.channels.fetch(logchannels[i]).then(channel => channel.send(`System Call: System ${command}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`));
				}
            }
        } else {
            if (command == "Word Blacklist") {
                console.log(`System ERROR: System ${command}: ${subCommand}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`);
                for (var i = 0; i < logchannels.length; i++) {
                    client.channels.fetch(logchannels[i]).then(channel => channel.send(`System ERROR: System ${command}: ${subCommand}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`));
                }
        } else if (subCommand != null) {
            console.log(`System ERROR: System ${command}: ${subCommand}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`);
        } else {
            console.log(`System ERROR: System ${command}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}. User tried to access admin data without permission!`);
			if (logValue == 'log') {
                for (var i = 0; i < logchannels.length; i++) {
                    client.channels.fetch(logchannels[i]).then(channel => channel.send(`System ERROR: System ${command}. User: ${message.author.tag}. Time: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.toTimeString().split(' ').shift().slice(0, 5)}.`));
                }
			}
        }
    }
}
function play(channel, connection, mode, txtchannel, index) {
	if (forceLeave) {
		forceLeave = false;
		channel.leave();
		return;
	}
	publicConnection = connection
	if (mode == "whole")
	{
		currentsong = index;
		console.log(songlist[index] + " (" + (index + 1) + "/" + songlist.length + ")"); // Here, you can see the current playing file at console.
		txtchannel.send(songlist[index] + " (" + (index + 1) + "/" + songlist.length + ")");
	connection
		.play(playList + songlist[index])
		.on("finish", () => {
			play(channel, connection, "whole", txtchannel, index + 1);
		})
		.on("error", err => console.log(err));
	}else if (mode == "random"){
		if (lsIndex == last5songs.length)
			lsIndex = 0;
		let rnd = getRndInteger(0, songlist.length);
		let wasnotplayed = true;
		for (let iv = 0; iv < last5songs.length && wasnotplayed; iv++){
			if (rnd == last5songs[iv])
			{
				wasnotplayed = false;
			}
		}
		if (!wasnotplayed) {
			play(channel, connection, "random", txtchannel);
		}else
		{
			currentsong = rnd;
			console.log(songlist[rnd] + " (" + (rnd + 1) + "/" + songlist.length + ")"); // Here, you can see the current playing file at console.
			txtchannel.send(songlist[rnd] + " (" + (rnd + 1) + "/" + songlist.length + ")");
			last5songs[lsIndex] = rnd;
			lsIndex ++;
			connection
				.play(playList + songlist[rnd])
				.on("finish", () => {
					play(channel, connection, "random", txtchannel);
				})
				.on("error", err => console.log(err));
		}
	} else if (mode == "specified") {
		index -=1;
		currentsong = index;
		console.log(songlist[index] + " (" + (index + 1) + "/" + songlist.length + ")"); // Here, you can see the current playing file at console.
		txtchannel.send(songlist[index] + " (" + (index + 1) + "/" + songlist.length + ")");
	connection
		.play(playList + songlist[index])
		.on("error", err => console.log(err));
	}else {
		LogCMD("Voice Module", true, "MODE.NOT.RECOGNIZED.EXCEPTION");
	}
}
    if (admins) {
        var allowedUsers = admins.get('contents').split(', ');
    }
    var allowed = false;
    async function f(item, index) {
        if (message.author.id === item) {
            allowed = true;
        }
    }
    allowedUsers.forEach(f);
    if (message.content.toLowerCase().startsWith(config.prefix) && allowed === true) {
        date = new Date();
        const input = message.content.slice(config.prefix.length).split(' ');
        const command = input.shift().toLowerCase();
        if (command === 'help') {
            var embed = new Discord.MessageEmbed();
            embed.setTitle('Commands');
            embed.addField('sys help', 'Shows all commands.');
            embed.addField('sys data add <name> <content>', 'Adds an entry to the database.');
            embed.addField('sys data edit <name> <content>', 'Edits a database entry.');
            embed.addField('sys data get <name>', 'Gets the contents of a database entry.');
            embed.addField('sys data getall', 'Lists the names of every entry in the database.');
            embed.addField('sys data delete <name>', 'Deletes a database entry.');
            embed.addField('sys message send <channelID> <message>', 'Sends a message to a specific channel.');
            embed.addField('sys message delete last', 'Deletes the last message in this channel.');
            embed.addField('sys message delete few <amount>', 'Deletes a few last messages in this channel.');
            embed.addField('sys message delete fewat <channelID> <amount>', 'Deletes a few last messages in a specific channel.');
            embed.addField('sys message delete lastat <channelID>', 'Deletes the last message in a specific channel.');
            embed.addField('sys date', 'Prints the system\'s date.');
            embed.addField('sys uptime', 'Prints the system\'s uptime.');
            embed.addField('sys reboot', 'Reboots the system.');
            embed.addField('sys shutdown', 'Reboots the system.');
            embed.addField('sys voice join', 'Joins the user\'s voice channel.');
            embed.addField('sys voice play <youtube link>', 'Joins the user\'s channel and plays a youtube video.');
            embed.addField('sys voice leave', 'Leaves the user\'s voice channel.');
            embed.addField('sys filterlist', 'Prints the system\'s illegal word list.');
            if (message.author.id === '275305152842301440') {
                embed.addField('----', 'Carp-only commands');
                embed.addField('sys admin add <id>', 'Adds an admin to the list.');
				embed.addField('sys admin log', 'Toggles command logging for all text channels.');
                embed.addField('sys admin list', 'Shows the admin list.');
            }
            embed.addField('Allowed Users', allowedUsers.join(', '));
            message.channel.send(embed);
            LogCMD(command, false, null);
        } else if (command === 'data') {
            const subCommand = input.shift().toLowerCase();
            const commandArgs = input.join(' ');
            if (subCommand === 'add') {
                const splitArgs = commandArgs.split(' ');
                const dataName = splitArgs.shift();
                const dataContents = splitArgs.join(' ');
                try {
                    const data = await Data.create({
                        name: dataName,
                        contents: dataContents,
                    });
                    message.channel.send(`Data: ${data.name} added.`);
                }
                catch (e) {
                    if (e.name === 'SequelizeUniqueConstraintError') {
                        LogCMD(command, true, subCommand);
                        return message.channel.send('This data already exists.');
                    } else {
                        LogCMD(command, true, subCommand);
                        return message.channel.send('Something went wrong with adding data.');
                    }
                }
            } else if (subCommand === 'get') {
                const dataName = commandArgs;
                const data = await Data.findOne({ where: { name: dataName } });
                if (data) {
                    message.channel.send(data.get('contents'));
                } else {
                    LogCMD(command, true, subCommand);
                    return message.channel.send(`Could not find data: ${dataName}`);
                }
            } else if (subCommand === 'edit') {
                const splitArgs = commandArgs.split(' ');
                const dataName = splitArgs.shift();
                const dataContents = splitArgs.join(' ');

                if (dataName === 'admins' && message.author.id != '275305152842301440') {
                    LogCMD(command, true, subCommand);
                    return message.channel.send("Admin data is admin only!");
                }
                const affectedRows = await Data.update({ contents: dataContents }, { where: { name: dataName } });
                if (affectedRows > 0) {
                    message.channel.send(`Data: ${dataName} was edited.`);
                } else {
                    LogCMD(command, true, subCommand);
                    return message.channel.send(`Could not find data with name: '${dataName}'.`);
                }
            } else if (subCommand === 'getall') {

                const dataList = await Data.findAll({ attributes: ['name'] });
                const dataString = dataList.map(d => d.name).join(', ') || 'No data set.';
                const embed = new Discord.MessageEmbed()
                    .setTitle('Data')
                    .setDescription(dataString);
                message.channel.send(embed);
            } else if (subCommand === 'delete') {
                const dataName = commandArgs;
                if (dataName === 'admins' && message.author.id != '275305152842301440') {
                    LogCMD(command, true, subCommand);
                    return message.channel.send("Admin data is admin only!");
                }
                const rowCount = await Data.destroy({ where: { name: dataName } });
                if (!rowCount) {
                    LogCMD(command, true, subCommand);
                    return message.channel.send('Data did not exist.');
                } else {
                    message.channel.send('Data deleted.');
                }
            }
            LogCMD(command, false, subCommand);
        } else if (command === 'reboot') {
			if (publicConnection != null){
				vc.leave();
			}
            message.channel.send('Rebooting.');
            LogCMD(command, false, null).then(() => { client.destroy() });
        } else if (command === 'shutdown') {
			if (publicConnection != null){
				vc.leave();
			}
            message.channel.send('Shutting down.');
            LogCMD(command, false, null).then(() => { client.destroy() });
        } else if (command === 'date') {
            message.channel.send((date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + " " + date.toTimeString().split(' ').shift().slice(0, 5));
            LogCMD(command, false, null);
        } else if (command === 'message') {
            const subCommand = input.shift().toLowerCase();
            if (subCommand === 'send') {
                const channelID = input.shift();
                const commandArgs = input.join(' ');
                client.channels.fetch(channelID).then(channelTest => channelTest.send(commandArgs));
            } else if (subCommand === 'delete') {
                if (message.channel.type === "text") {
                    const type = input.shift();
                    if (type === 'last') {
                        message.channel.bulkDelete(2);
                    } else if (type === 'lastat') {
                        const channelID = input.shift();
                        client.channels.fetch(channelID).then(channelTest => channelTest.lastMessage.delete());
                    } else if (type === 'few') {
                        const amount = input.shift();
                        message.channel.bulkDelete(amount + 1);
                    } else if (type === 'fewat') {
                        const channelID = input.shift();
                        const amount = input.shift();
                        message.channel.send(`Deleted: ${amount} messages in channel: <#${channelID}>.`)
                        client.channels.fetch(channelID).then(channelTest => channelTest.bulkDelete(amount));
                    }
                }
            }
            LogCMD(command, false, subCommand);
        } else if (command === 'uptime') {
            const uptime = client.uptime;
            message.channel.send("Uptime: " + uptime + "ms / " + (uptime / 1000).toString().split('.').shift() + " seconds.");
            LogCMD(command, false, null);
        } else if (command === 'voice') {
            const subCommand = input.shift().toLowerCase();
            if (subCommand === 'join') {
                if (message.member.voice.channel) {
                    const connection = await message.member.voice.channel.join();
                } else {
                    LogCMD(command, true, subCommand);
                    return message.channel.send('System ERROR: No channel found!');
                }
            } else if (subCommand === 'playwhole') {
				currentsong = -1;
				vc = message.member.voice.channel;
				 message.member.voice.channel.join().then(connection => play(message.member.voice.channel, connection, "whole", message.channel, 0))
				.catch(e => console.log(e));
                //play(message.member.voice.channel, connection, currentIndex);
            } else if (subCommand === 'playrandom') {
				currentsong = -1;
				vc = message.member.voice.channel;
				last5songs = [-1, -1, -1, -1, -1];
				lsIndex = 0;
				message.member.voice.channel.join().then(connection => play(message.member.voice.channel, connection, "random", message.channel))
				.catch(e => console.log(e));
            } else if (subCommand === 'leave') {
				currentsong = -1;
                const connection = undefined;
                message.member.voice.channel.leave();
            } else if (subCommand === 'skip') {
				if (publicConnection != null){
					publicConnection.dispatcher.end();
				}
            }else if (subCommand === 'currentsong') {
				if (publicConnection != null){
					const time = publicConnection.dispatcher.streamTime;
					message.channel.send("Current Song: " + songlist[currentsong] + " (" + (currentsong + 1) + "/" + songlist.length + ") " + `${time}`);
				
				}
			}else if (subCommand === 'songlist') {
				var embed = new Discord.MessageEmbed();
				embed.setTitle('Song List');
				function getSongList(index, key) {
					embed.addField(`#${key + 1}: `, index);
					if (key % 24 == 0 && key > 0){
						message.channel.send(embed);
						embed = new Discord.MessageEmbed();
					}
				}
				songlist.forEach(getSongList);
				message.channel.send(embed);
			} else if (subCommand === 'play') {
				vc = message.member.voice.channel;
				message.member.voice.channel.join().then(connection => play(message.member.voice.channel, connection, "specified", message.channel, parseInt(input.shift())))
				.catch(e => console.log(e));
            }
            LogCMD(command, false, subCommand);
        } else if (command === 'admin' && message.author.id === '275305152842301440') {
            subCommand = input.shift();
            if (subCommand === 'add') {
                const admins = await Data.findOne({ where: { name: 'admins' } });
                if (admins) {
                    var adminlist = admins.get('contents');
                }
                adminlist = adminlist + ", " + input.shift();
                const affectedRows = await Data.update({ contents: adminlist }, { where: { name: 'admins' } });
                if (affectedRows > 0) {
                    message.channel.send(`Admin list edited.`);
                }
            } else if (subCommand === 'list') {
                const embed = new Discord.MessageEmbed();
                embed.setTitle('Admins');
                function f2(item, index) {
                    embed.addField('#' + (index + 1), item);
                }
                allowedUsers.forEach(f2);
                message.channel.send(embed);
            } else if (subCommand === 'log') {
                const logData = await Settings.findOne({ where: { name: 'log' } });
                const logValue = logData.get('contents');
                if (logValue == 'log') {
                    LogCMD(command, false, subCommand);
                    const affectedRows = await Settings.update({ contents: 'noLog' }, { where: { name: 'log' } });
                    if (affectedRows > 0) {
                        message.channel.send(`Logs are now: Off`);
                    }
                } else {
                    const affectedRows = await Settings.update({ contents: 'log' }, { where: { name: 'log' } });
                    if (affectedRows > 0) {
                        message.channel.send(`Logs are now: On`);
                    }
                }
            }
            LogCMD(command, false, subCommand);
        } else if (command === 'filterlist') {
            var embed = new Discord.MessageEmbed();
            embed.setTitle('Illegal Words');
            function illegalList(key, index) {
                embed.addField(`#${index + 1}: `, key);
				if (index % 24 == 0 && index > 0){
					message.channel.send(embed);
					embed = new Discord.MessageEmbed();
				}
            }
            illegalWords.forEach(illegalList);
            message.channel.send(embed);
            LogCMD(command, false, null);
        }
    }
    else {
        function detectFilter(key, index) {
            if (message.content.toLowerCase().includes(key) && !message.author.bot && !allowed) {
                message.delete();
                message.channel.send("<@" + message.author.id + ">" + " Detected an illegal word!");
                LogCMD("Word Blacklist", true, key);
            }
        }
        //illegalWords.forEach(detectFilter);
    }
});