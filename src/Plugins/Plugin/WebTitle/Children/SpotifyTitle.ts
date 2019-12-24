import * as webService from '../../../../Services/WebService';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';

class SpotifyTitle implements IPluginChildInterface {
  constructor() {

    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    return webService.REGEXP.SPOTIFY.test(message);
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    if (!this.supportsAction(message, channel, clientService)) {
      return;
    }

    webService.downloadPageDom(message, 'curl/7.55.1').then((dom) => {
      if (!dom) {
        return;
      }
      const document = dom.window.document;
      try {
        const el = document.querySelector('script[type="application/ld+json"]');
        if (!el) {
          return;
        }
        const jsonObj = JSON.parse(el.textContent);
        clientService.say(jsonObj.description, channel);
      } catch (e) {}
    }).catch(e => {});
  }
}

export default SpotifyTitle;
