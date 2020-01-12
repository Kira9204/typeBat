import { IClientMessage } from '../../Types/ClientMessage';
import * as YoutubeSearch from '../../Services/YoutubeSearchService';
import * as webService from '../../Services/WebService';
import DiscordClient from '../DiscordClient';
import { ISuggestedVideo } from '../../Services/YoutubeSearchService';
import ytdl from 'ytdl-core';

export interface IPlaylistItem {
  title: string;
  url: string;
}

export const MP3s = ['bruh', 'oj', 'kaften', 'wow'];
export class Jukebox {
  private readonly client: DiscordClient;
  public trigger: string;
  public volume: number;
  public playList: IPlaylistItem[];
  public currentSong: number;
  public REGEXP_VOLUME: RegExp;
  public isPaused: boolean;

  constructor(protocolService: DiscordClient) {
    this.client = protocolService;
    this.trigger = protocolService.getClient().config.trigger;
    this.volume = 0.6;
    this.playList = [];
    this.currentSong = -1;
    this.REGEXP_VOLUME = new RegExp(`${this.trigger}vol \\d+`);
    this.isPaused = false;
  }

  onChannelMessage(msgObj: IClientMessage) {
    const service = this.client;
    const firstWord = msgObj.message.split(' ')[0];
    if (firstWord === `${this.trigger}p`) {
      service.resume(); //In case we have paused

      const splitted = msgObj.message.split(' ');
      if (!splitted[1]) {
        return;
      }

      const addToPlaylist = (title: string, playUrl: string) => {
        if (this.playList.length < 0) {
          this.playList = [
            {
              title: title,
              url: playUrl
            }
          ];
        } else {
          this.playList.push({
            title: title,
            url: playUrl
          });
        }

        if (this.currentSong < 0) {
          this.currentSong = -1;
          service.playNext();
        }

        //service.say(`Added song to playlist: ${title}`, msgObj.channel);
      };

      if (webService.parseUrl(splitted[1])) {
        const playUrl = splitted[1];
        if (webService.REGEXP.YOUTUBE.test(playUrl)) {
          ytdl
            .getBasicInfo(playUrl)
            .then((videoInfo: ytdl.videoInfo) => {
              addToPlaylist(videoInfo.title, playUrl);
            })
            .catch((err) => {
              console.log('Failed to get video info:', err);
            });
        } else if (webService.REGEXP.SOUNDCLOUD.test(playUrl)) {
          webService.downloadPageTitle(playUrl).then((pageTitle) => {
            if (pageTitle) {
              addToPlaylist(pageTitle, playUrl);
            }
          });
        } else {
          addToPlaylist(`Custom audio stream: ${playUrl}`, playUrl);
        }
      } else {
        let queryString = msgObj.message.substring(`${this.trigger} p`.length);
        if (MP3s.includes(queryString)) {
          addToPlaylist(`Meme: ${queryString}`, queryString);
          return true;
        }
        const onVideoSuggestions = (videoSuggestions: ISuggestedVideo[]) => {
          console.log('1', this.playList, this.currentSong);
          if (videoSuggestions.length === 0) {
            service.say("I couldn't find any matching videos", msgObj.channel);
            return;
          }
          const videoSuggestion = videoSuggestions[0];
          const playUrl = `https://www.youtube.com/watch?v=${videoSuggestion.videoId}`;
          addToPlaylist(videoSuggestion.title, playUrl);
        };
        YoutubeSearch.findYoutubeVideos(queryString, 5, onVideoSuggestions);
        this.isPaused = false;
      }
      return true;
    } else if (firstWord === `${this.trigger}s`) {
      service.stopSound();
      return true;
    } else if (firstWord === `${this.trigger}pause`) {
      service.pause();
      return true;
    } else if (
      firstWord === `${this.trigger}skip` ||
      firstWord === `${this.trigger}next`
    ) {
      service.playNext();
      return true;
    } else if (firstWord === `${this.trigger}list`) {
      const playlistNames = this.playList.map((e) => {
        return e.title;
      });
      if (playlistNames.length !== 0) {
        service.say('Playlist: ' + playlistNames.join(', '), msgObj.channel);
      }
      return true;
    } else if (firstWord === `${this.trigger}clean`) {
      this.playList = [];
      this.currentSong = -1;
      service.say('Playlist cleaned', msgObj.channel);
      return true;
    } else if (this.REGEXP_VOLUME.test(msgObj.message)) {
      let newVolume = this.volume;
      const newVolStr = msgObj.message.split(' ')[1];
      try {
        newVolume = parseInt(newVolStr) / 100;
      } catch (e) {
        service.say('Volume is not a percentage!', msgObj.channel);
        return true;
      }
      if (newVolume < 1 || newVolume > 100) {
        service.say('Volume must be between 1 and 100', msgObj.channel);
        return true;
      }
      service.setVolume(newVolume);
      return true;
    } else if (
      msgObj.message === this.trigger + 'vol' ||
      msgObj.message === this.trigger + 'volume'
    ) {
      service.say('Current volume: ' + this.volume * 100, msgObj.channel);
      return true;
    }
    return false;
  }
}

export default Jukebox;
