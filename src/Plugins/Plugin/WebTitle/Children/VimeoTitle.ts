import * as webLib from '../../../../Libs/WebLib';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { formatNumber, formatDurationFromSecs } from './utils';

interface iVideoModel {
  title: string;
  channel: string;
  numPlays: string;
  duration: string;
  likes: string;
}

const constructModel = (data: string) => {
  let obj = JSON.parse(data);
  if (obj.length === 0) {
    return false;
  }
  obj = obj[0];

  const title = obj.title;
  const channel = obj.user_name;
  let numPlays = '';
  if (obj.stats_number_of_plays !== undefined) {
    numPlays = formatNumber(obj.stats_number_of_plays);
  }
  let likes = '';
  if (obj.stats_number_of_likes) {
    likes = formatNumber(obj.stats_number_of_likes);
  }
  const duration = formatDurationFromSecs(obj.duration);
  return {
    title,
    channel,
    numPlays,
    duration,
    likes
  };
};

class VimeoTitle implements IPluginChildInterface {
  constructor() {
    this.getVideoId = this.getVideoId.bind(this);
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    return webLib.REGEXP.VIMEO.test(message);
  }

  public getVideoId(input: string) {
    const match = webLib.REGEXP.VIMEO.exec(input);
    if (match == null || match[1] === undefined) {
      return false;
    }
    return match[1];
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    if (
      !this.supportsAction(message, channel, clientService) ||
      !this.getVideoId(message)
    ) {
      return;
    }

    const videoId = this.getVideoId(message);
    const apiUrl = `https://vimeo.com/api/v2/video/${videoId}.json`;
    webLib
      .downloadPage(apiUrl)
      .then((data: string) => {
        const videoInfo: boolean | iVideoModel = constructModel(data);
        if (!videoInfo) {
          return;
        }
        const retString = `Title: ${videoInfo.title}. Channel: ${
          videoInfo.channel
        }. ${
          videoInfo.numPlays !== '' ? `Views: ${videoInfo.numPlays}.` : ''
        } Duration: ${videoInfo.duration}. ${
          videoInfo.likes !== '' ? `Likes: ${videoInfo.likes}` : ''
        }`;

        clientService.say(retString, channel);
      })
      .catch((e) => {});
  }
}

export default VimeoTitle;
