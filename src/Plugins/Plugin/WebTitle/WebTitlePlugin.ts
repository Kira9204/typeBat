import * as webLib from '../../../Libs/WebLib';
import { IClientMessage, PROTOCOL } from '../../../Types/ClientMessage';
import {
  IPluginChildInterface,
  IPluginInterface
} from '../../../Types/PluginInterface';
import { isPluginDisabled } from '../../PluginsController';
import PriceTitle from './Children/PriceTitle';
import SpotifyTitle from './Children/SpotifyTitle';
import SteamTitle from './Children/SteamTitle';
import SVTPlayTitle from './Children/SVTPlayTitle';
import TwitchTitle from './Children/TwitchTitle';
import VimeoTitle from './Children/VimeoTitle';
import YoutubeTitle from './Children/YoutubeTitle';
import TwitterTitle from './Children/TwitterTitle';

const PLUGIN_NAME = 'PLUGIN_WEB_TITLE';
class WebTitlePlugin implements IPluginInterface {
  public childPlugins: IPluginChildInterface[];
  constructor() {
    this.childPlugins = [];

    this.loadChildren = this.loadChildren.bind(this);
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
    this.sendTitle = this.sendTitle.bind(this);

    this.loadChildren();
  }

  private loadChildren() {
    this.childPlugins = [
      new PriceTitle(),
      new YoutubeTitle(),
      new SpotifyTitle(),
      new SteamTitle(),
      new SVTPlayTitle(),
      new TwitchTitle(),
      new TwitterTitle(),
      new VimeoTitle()
    ];
  }

  public async supportsAction(messageObj: IClientMessage) {
    if (
      isPluginDisabled(
        messageObj.clientService,
        messageObj.channel,
        PLUGIN_NAME
      )
    ) {
      return false;
    }

    const parts = messageObj.message.split(' ');
    for (const part of parts) {
      if (webLib.parseUrl(part)) {
        let valid = false;
        // Notice: The web site might block HEAD requests
        await webLib
          .getHeaders(part)
          .then((res) => {
            const ct = res.headers['content-type'];
            valid = ct.startsWith('text/');
          })
          .catch((e) => {
            valid = false;
          });
        return valid;
      }
    }
    return false;
  }

  public async trigger(messageObj: IClientMessage) {
    if (!this.supportsAction(messageObj)) {
      return false;
    }

    const parts = messageObj.message.split(' ');
    for (const part of parts) {
      if (!webLib.parseUrl(part)) {
        continue;
      }

      for (const service of this.childPlugins) {
        if (
          service.supportsAction(
            part,
            messageObj.channel,
            messageObj.clientService,
            messageObj.isSmallMessage
          )
        ) {
          service.trigger(
            part,
            messageObj.channel,
            messageObj.clientService,
            messageObj.isSmallMessage
          );
          return;
        }
      }
      webLib.downloadPageTitle(part).then((data) => {
        if (!data) {
          return;
        }
        if (data.length > 0) {
          this.sendTitle(messageObj, part, data);
        }
      });
    }
  }

  private sendTitle(messageObj: IClientMessage, part: string, title: string) {
    /*
    if (part.length > 212 && messageObj.protocol === PROTOCOL.IRC) {
      webLib
        .post('https://s.d3ff.se', { link: part })
        .then((response) => {
          if (title.length > 0) {
            messageObj.clientService.say(
              `Title: (${response.shortLink}) ${title}`,
              messageObj.channel
            );
          } else {
            messageObj.clientService.say(
              `Short: ${response.shortLink}`,
              messageObj.channel
            );
          }
        })
        .catch((err) => {
          console.log('Failed to insert link!', err);
        });
    } else if (title.length > 0) {
      messageObj.clientService.say(`Title: ${title}`, messageObj.channel);
    }
     */
    messageObj.clientService.say(`Title: ${title}`, messageObj.channel);
  }
}

export default WebTitlePlugin;
