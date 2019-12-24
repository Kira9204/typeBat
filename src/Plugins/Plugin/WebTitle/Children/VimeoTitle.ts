import * as webService from '../../../../Services/WebService';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { formatNumber } from './PriceFormatter';

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
  let duration = obj.duration;
  let likes = '';
  if (obj.stats_number_of_likes) {
    likes = formatNumber(obj.stats_number_of_likes);
  }

  const hours = Math.round((duration / 3600) % 24);
  const minutes = Math.round((duration / 60) % 60);
  const seconds = Math.round(duration % 60);

  duration = '';
  if (hours > 0) {
    duration += '' + hours + 'h ';
  }
  if (minutes > 0) {
    duration += '' + minutes + 'm ';
  }
  if (seconds > 0) {
    duration += '' + seconds + 's';
  }

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
    return webService.REGEXP.VIMEO.test(message);
  }

  public getVideoId(input: string) {
    const match = webService.REGEXP.VIMEO.exec(input);
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
    webService.downloadPage(apiUrl).then((data: string) => {
      const videoInfo: boolean | iVideoModel = constructModel(data);
      if (!videoInfo) {
        return;
      }
      const retString = `Title: ${videoInfo.title}. Channel: ${videoInfo.channel}. Views: ${videoInfo.numPlays}. Duration: ${videoInfo.duration}. Likes: ${videoInfo.likes}`;

      clientService.say(retString, channel);
    }).catch(e => {});
  }
}

export default VimeoTitle;
