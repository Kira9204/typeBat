import moment from 'moment';
import * as webLib from '../../../../Libs/WebLib';
import { formatNumber } from './PriceFormatter';
// @ts-ignore
import { API_KEYS } from '../../../../../apikeys';
const API_KEY_YOUTUBE = API_KEYS.YOUTUBE;

import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
interface IVideoModel {
  title: string;
  channel: string;
  duration: string;
  views: string;
  likeCount: string;
  dislikeCount: string;
  likeRatio: string;
  publishedAt: string;
}

const constructVideoModel = (data: string): IVideoModel => {
  const obj = JSON.parse(data);
  if (obj.items !== undefined && obj.items.length > 0) {
    const item = obj.items[0];

    const title = item.snippet.title;
    const channel = item.snippet.channelTitle;
    let duration = item.contentDetails.duration;
    const views = parseInt(item.statistics.viewCount);
    const likeCount = parseInt(item.statistics.likeCount);
    const dislikeCount = parseInt(item.statistics.dislikeCount);
    let likeRatio = '';
    const total = likeCount + dislikeCount;

    if (likeCount != null && dislikeCount != null) {
      likeRatio = '' + Math.round((likeCount / total) * 100);
      likeRatio += '%';
    }

    if (duration === 'PT0S') {
      duration = 'LIVE';
    } else {
      duration = duration.substring(2);
      let index = duration.indexOf('H');
      if (index > -1) {
        duration =
          duration.substring(0, index + 1) +
          ' ' +
          duration.substring(index + 1);
      }
      index = duration.indexOf('M');
      if (index > -1) {
        duration =
          duration.substring(0, index + 1) +
          ' ' +
          duration.substring(index + 1);
      }
      duration = duration.toLowerCase();
    }
    const publishedAt = moment(item.snippet.publishedAt).format(
      'ddd Do, MMM YYYY'
    );

    return {
      channel,
      dislikeCount: formatNumber(dislikeCount),
      duration,
      likeCount: formatNumber(likeCount),
      likeRatio,
      title,
      views: formatNumber(views),
      publishedAt
    };
  }
};

class YoutubeTitle implements IPluginChildInterface {
  constructor() {
    YoutubeTitle.getVideoId = YoutubeTitle.getVideoId.bind(this);
    this.getVideoInfo = this.getVideoInfo.bind(this);
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    return webLib.REGEXP.YOUTUBE.test(message);
  }

  public static getVideoId(input: string) {
    const match = webLib.REGEXP.YOUTUBE.exec(input);
    if (match == null || match[2] === undefined) {
      return false;
    }
    return match[2];
  }

  public getVideoInfo(url: string, callback: (videoInfo: IVideoModel) => void) {
    const videoId = YoutubeTitle.getVideoId(url);
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY_YOUTUBE}&fields=items(snippet,statistics,contentDetails)&part=snippet,statistics,contentDetails`;
    webLib.downloadPage(apiUrl).then((data: string) => {
      const videoInfo = constructVideoModel(data);
      if (videoInfo) {
        callback(videoInfo);
      }
    });
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    if (
      !this.supportsAction(message, channel, clientService, isSmallMessage) ||
      !YoutubeTitle.getVideoId(message)
    ) {
      return;
    }

    this.getVideoInfo(message, (videoInfo: IVideoModel) => {
      const retString = `Title: ${videoInfo.title}. Channel: ${videoInfo.channel}. Duration: ${videoInfo.duration}. Views: ${videoInfo.views}. Uploaded: ${videoInfo.publishedAt}.`;
      clientService.say(retString, channel);
    });
  }
}

export default YoutubeTitle;
