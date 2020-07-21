import Discord from 'discord.js';
import fs from 'fs';
import ytdl from 'ytdl-core';
import PluginsController from '../Plugins/PluginsController';
import * as webLib from '../Libs/WebLib';
import Jukebox, { IPlaylistItem, MP3s } from './Shared/Jukebox';
// @ts-ignore
import { API_KEYS } from '../../apikeys';

// Used by discord internally when streaming music
const request: Request = require('request');
const m3u8stream = require('m3u8stream');

// Types
import { IClientMessage, MSG_TYPE, PROTOCOL } from '../Types/ClientMessage';
import { IClientProtocol } from '../Types/ClientProtocolInterface';
import { ITypeDiscordServiceConfig } from '../Types/TypeConfig';

const EVT_TEXT_MESSAGE = 'message';
const EVT_VOICE_STATE_UPDATE = 'voiceStateUpdate';
const EVT_ERROR = 'error';

export interface IUserChannel {
  channel: string;
  userName: string;
}

class DiscordClient implements IClientProtocol {
  public config: ITypeDiscordServiceConfig;
  private client: Discord.Client;
  private streamDispatcher: Discord.StreamDispatcher;
  private voiceConnection: Discord.VoiceConnection;
  private jukebox: Jukebox;
  private pluginsController: PluginsController;
  private readonly trigger: string;
  private lastMsg: Discord.Message;
  private lastMsgChannelId: string;

  constructor(
    clientConfig: ITypeDiscordServiceConfig,
    pluginsController: PluginsController
  ) {
    console.log('Creating a new Discord service...');
    console.log('Trigger:', clientConfig.trigger);
    console.log('Token:', clientConfig.token);
    console.log('TargetChannelId":', clientConfig.targetChannelId);
    console.log('targetVoiceChannelId:', clientConfig.targetVoiceChannelId);
    console.log('');

    this.config = clientConfig;
    this.pluginsController = pluginsController;
    this.client = new Discord.Client();
    this.streamDispatcher = null;
    this.voiceConnection = null;
    this.lastMsgChannelId = '';

    this.trigger = clientConfig.trigger;

    this.jukebox = new Jukebox(this);

    this.connect = this.connect.bind(this);
    this.onChannelMessage = this.onChannelMessage.bind(this);
    this.onPmMessage = this.onPmMessage.bind(this);
    this.playSound = this.playSound.bind(this);
    this.stopSound = this.stopSound.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
    this.setVolume = this.setVolume.bind(this);
    this.playNext = this.playNext.bind(this);

    this.onVoiceStateChanged = this.onVoiceStateChanged.bind(this);
    this.say = this.say.bind(this);
    this.getClient = this.getClient.bind(this);
    this.getUsersInVoiceChannelsMap = this.getUsersInVoiceChannelsMap.bind(
      this
    );

    this.connect();
  }

  public connect() {
    this.client.on(EVT_TEXT_MESSAGE, this.onChannelMessage);
    this.client.on(EVT_VOICE_STATE_UPDATE, this.onVoiceStateChanged);
    this.client.on(EVT_ERROR, (error: Discord.DiscordAPIError) => {
      console.log('DiscordClient: ERROR:', error);
    });
    this.client.login(this.config.token);
  }

  public onChannelMessage(message: Discord.Message) {
    if (
      message.author.id === this.client.user.id ||
      this.config.ignoreUsers.includes(message.author.id)
    ) {
      return;
    }
    this.lastMsg = message;
    this.lastMsgChannelId = message.channel.id;

    const msgObj: IClientMessage = {
      channel: message.channel.id,
      clientService: this,
      message: message.content,
      protocol: PROTOCOL.DISCORD,
      type: MSG_TYPE.MESSAGE,
      isSmallMessage: true
    };

    if (message.channel.type === 'dm') {
      return this.onPmMessage(msgObj);
    }

    if (!this.jukebox.onChannelMessage(msgObj)) {
      this.pluginsController.trigger(msgObj);
    }
  }

  public onPmMessage(message: IClientMessage) {}

  public playSound(playlistItem: IPlaylistItem, onEnd: () => void) {
    const isInChannel = this.client.voiceConnections.array().length !== 0;

    const getAuthorVoiceChannel = () => {
      const voiceChannelArray = this.lastMsg.guild.channels
        .filter((v) => v.type === 'voice')
        // @ts-ignore
        .filter((v) => v.members.has(this.lastMsg.author.id))
        .array();
      if (voiceChannelArray.length === 0) {
        return null;
      } else {
        return voiceChannelArray[0];
      }
    };

    const appendStreamDispatcherEnd = () => {
      this.streamDispatcher.on('error', console.error);
      // Catch the end event.
      this.streamDispatcher.on('end', () => {
        this.streamDispatcher.end();
        if(!this.jukebox.skipNext) {
          onEnd();
        }
      });

      this.jukebox.skipNext = false;
    };

    const play = () => {
      console.log('PLAY THIS', playlistItem);
      if (webLib.REGEXP.YOUTUBE.test(playlistItem.url)) {
        this.say('Now Playing: ' + playlistItem.title, this.lastMsgChannelId);
        // @ts-ignore
        const stream = ytdl(playlistItem.url, { filter: 'audioonly' });
        if (this.streamDispatcher) {
          this.streamDispatcher.end();
        }
        // @ts-ignore
        this.streamDispatcher = this.voiceConnection.playStream(stream, {
          volume: this.jukebox.volume
        });
        appendStreamDispatcherEnd();
      } else if (webLib.REGEXP.SOUNDCLOUD.test(playlistItem.url)) {
        webLib.downloadPage(playlistItem.url).then((dataStr1) => {
          const found = dataStr1.indexOf('/stream/hls');
          const hlsUrl = dataStr1.substring(found - 100, found + 11);
          webLib
            .downloadPage(hlsUrl + '?client_id=' + API_KEYS.SOUNDCLOUD)
            .then((dataStr2) => {
              this.say(
                'Now Playing: ' + playlistItem.title,
                this.lastMsgChannelId
              );
              const obj = JSON.parse(dataStr2);
              const streamUrl = obj.url;
              if (this.streamDispatcher) {
                this.streamDispatcher.end();
              }
              // @ts-ignore
              this.streamDispatcher = this.voiceConnection.playStream(
                m3u8stream(streamUrl, { parser: 'm3u8' }),
                { volume: this.jukebox.volume }
              );
              appendStreamDispatcherEnd();
            });
        });
      }
      //Memes - testing. No this isn't pretty.
      else if (MP3s.includes(playlistItem.url)) {
        const soundFile = './sounds/' + playlistItem.url + '.mp3';
        if (!fs.existsSync(soundFile)) {
          return;
        }
        const readStream = fs.createReadStream(soundFile);
        if (this.streamDispatcher) {
          this.streamDispatcher.end();
        }
        this.streamDispatcher = this.voiceConnection.playStream(readStream);
        appendStreamDispatcherEnd();
      }

      //Play a music stream
      else {
        this.say('Now Playing: ' + playlistItem.title, this.lastMsgChannelId);
        if (this.streamDispatcher) {
          this.streamDispatcher.end();
        }
        this.streamDispatcher = this.voiceConnection.playStream(
          // @ts-ignore
          request(playlistItem.url),
          { volume: this.jukebox.volume }
        );
        appendStreamDispatcherEnd();
      }
    };

    if (!isInChannel) {
      const authorVoiceChannel = getAuthorVoiceChannel();
      if (!authorVoiceChannel) {
        this.say('User is not in voice channel', this.lastMsgChannelId);
        if (this.streamDispatcher) {
          this.jukebox.playList.pop();
        } else {
          this.jukebox.playList.pop();
          this.jukebox.currentSong -= 1;
        }
        return;
      }
      // @ts-ignore
      authorVoiceChannel.join().then((voiceConnection) => {
        console.log('DiscordClient: Joined voice channel!');
        this.voiceConnection = voiceConnection;
        play();
      });
    } else {
      this.jukebox.skipNext = true;
      play();
    }
  }

  public stopSound() {
    try {
      this.voiceConnection.channel.leave();
    } catch (e) {}
    try {
      this.streamDispatcher.end();
    } catch (e) {}

    this.streamDispatcher = null;
    this.voiceConnection = null;

    this.jukebox.currentSong = -1;
    this.jukebox.playList = [];
  }

  public pause() {
    if (this.streamDispatcher) {
      this.streamDispatcher.pause();
    }
    this.jukebox.isPaused = true;
  }

  public resume() {
    if (!this.jukebox.isPaused && this.jukebox.playList.length !== 0) {
      return;
    }

    if (this.streamDispatcher) {
      this.streamDispatcher.resume();
    }
    this.jukebox.isPaused = false;
  }

  public setVolume(vol: number) {
    this.jukebox.volume = vol;

    if (this.streamDispatcher) {
      this.streamDispatcher.setVolume(vol);
    }
  }

  public playNext() {
    this.jukebox.currentSong++;
    console.log('playNext!', this.jukebox.currentSong, this.jukebox.playList.length > this.jukebox.currentSong)
    if (this.jukebox.playList.length > this.jukebox.currentSong) {
      this.playSound(
        this.jukebox.playList[this.jukebox.currentSong],
        this.playNext
      );
    } else {
      console.log('Stopsound!');
      this.stopSound();
    }
  }

  private onVoiceStateChanged(
    oldMember: Discord.GuildMember,
    newMember: Discord.GuildMember
  ) {
    const newUserChannel = newMember.voiceChannel;
    const oldUserChannel = oldMember.voiceChannel;

    if (
      oldMember.user.id === this.client.user.id ||
      newMember.user.id === this.client.user.id ||
      this.config.ignoreUsers.includes(oldMember.user.id) ||
      this.config.ignoreUsers.includes(newMember.user.id)
    ) {
      return;
    }

    if (oldUserChannel === undefined && newUserChannel !== undefined) {
      const msgObj: IClientMessage = {
        channel: newUserChannel.id,
        clientService: this,
        message: `Discord: ${newMember.user.username} joined voice channel ${newUserChannel.name}`,
        protocol: PROTOCOL.DISCORD,
        type: MSG_TYPE.USER_JOINED_VOICE
      };
      this.pluginsController.trigger(msgObj);
      //this.say(`User joined voice channel: ${newUserChannel.name}: ${newMember.user.username}`)
    } else if (newUserChannel === undefined) {
      const msgObj: IClientMessage = {
        channel: '',
        clientService: this,
        message: `Discord: ${oldMember.user.username} left voice channel ${oldUserChannel.name}`,
        protocol: PROTOCOL.DISCORD,
        type: MSG_TYPE.USER_LEFT_VOICE
      };
      this.pluginsController.trigger(msgObj);
      //this.say(`User left voice channel: ${oldUserChannel.name}: ${oldMember.user.username}`)
    }
  }

  public say(message: string, to?: string | null) {
    if (!to && this.lastMsgChannelId.length === 0) {
      return;
    }
    const channelId = to ? to : this.config.targetChannelId;
    const channel = this.client.channels.get(channelId);
    if (!channel) {
      // Our client is not ready yet, or it isn't connected to the network.
      console.log('DiscordClient: Could not find channel', channelId);
    }

    // @ts-ignore
    channel.send(message);
  }

  public getClient() {
    return this;
  }

  public getUsersInVoiceChannelsMap() {
    const channels = this.client.channels.array();
    const voiceChannels = channels.filter((e) => e.type === 'voice');
    const usersChannels: IUserChannel[] = [];
    voiceChannels.forEach((vc: Discord.VoiceChannel) => {
      const members = vc.members.array();
      if (members.length > 0) {
        members.forEach((member: Discord.GuildMember) => {
          usersChannels.push({
            channel: vc.name,
            userName: member.user.username
          });
        });
      }
    });

    const channelMap: Map<string, string[]> = new Map();
    usersChannels.forEach((e) => {
      if (!channelMap.has(e.channel)) {
        channelMap.set(e.channel, []);
      }

      const arr = channelMap.get(e.channel);
      arr.push(e.userName);
      channelMap.set(e.channel, arr);
    });

    return channelMap;
  }
}
export default DiscordClient;
