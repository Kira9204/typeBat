import * as webService from '../../../../Services/WebService';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { API_KEY_TWITCH } from './Constants';
import { formatNumber } from './PriceFormatter';

const constructModel = (data: string) => {
  const obj = JSON.parse(data);

  const status = obj.status;
  let game = obj.game;
  if (game == null) {
    game = 'Event';
  }
  const streamer = obj.display_name;
  const views = obj.views;
  const followers = obj.followers;

  return {
    followers: formatNumber(followers),
    game,
    status,
    streamer,
    views: formatNumber(views)
  };
};

class TwitchTitle implements IPluginChildInterface {
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
    return webService.REGEXP.TWITCH.test(message);
  }

  public getVideoId(input: string) {
    const match = webService.REGEXP.TWITCH.exec(input);
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
    const apiUrl = `https://api.twitch.tv/kraken/channels/${videoId}?client_id=${API_KEY_TWITCH}`;

    webService.downloadPage(apiUrl).then((data: string) => {
      const videoInfo = constructModel(data);
      const retString = `Title: ${videoInfo.status}. Channel: ${videoInfo.streamer}. Views: ${videoInfo.views}. Followers: ${videoInfo.followers}`;

      clientService.say(retString, channel);
    }).catch(e => {});
  }
}

export default TwitchTitle;
