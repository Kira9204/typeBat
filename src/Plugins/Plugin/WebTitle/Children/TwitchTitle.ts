import * as webLib from '../../../../Libs/WebLib';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { formatNumber } from './PriceFormatter';

// @ts-ignore
import { API_KEYS } from '../../../../../apikeys';
const API_KEY_TWITCH = API_KEYS.TWITCH;

class TwitchTitle implements IPluginChildInterface {
  constructor() {
    this.getUserName = this.getUserName.bind(this);
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    return webLib.REGEXP.TWITCH.test(message);
  }

  public getUserName(input: string) {
    const match = webLib.REGEXP.TWITCH.exec(input);
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
      !this.getUserName(message)
    ) {
      return;
    }

    const userName = this.getUserName(message);
    const apiUrl = `https://api.twitch.tv/helix/streams?user_login=${userName}`;

    webLib
      .downloadPage(apiUrl, { 'Client-ID': API_KEY_TWITCH })
      .then((data: string) => {
        const parsedObj = JSON.parse(data);
        if (parsedObj.data.length === 0) {
          clientService.say(
            'No twitch stream data from API (User offline)',
            channel
          );
          return;
        }

        const streamObj = parsedObj.data[0];
        const userName = streamObj.user_name;
        const title = streamObj.title;
        const viewerCount = formatNumber(streamObj.viewer_count);

        const retString = `Title: ${title}. User: ${userName}. Viewers: ${viewerCount}`;
        clientService.say(retString, channel);
      })
      .catch((e) => {});
  }
}

export default TwitchTitle;
