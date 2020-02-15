import * as webLib from '../../../../Libs/WebLib';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { IClientService } from '../../../../Types/ClientMessage';
import { JSDOM } from 'jsdom';

interface IEmbeddedTweet {
  author_name: string;
  author_url: string;
  html: string;
}

class TwitterTitle implements IPluginChildInterface {
  constructor() {
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    return webLib.REGEXP.TWITTER.test(message);
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    if (!this.supportsAction(message, channel, clientService, isSmallMessage)) {
      return;
    }

    const embedTweetApiUrl = `https://publish.twitter.com/oembed?url=${message}&partner=&hide_thread=false`;
    webLib.downloadPage(embedTweetApiUrl).then((data: string) => {
      const embeddedObj: IEmbeddedTweet = JSON.parse(data);
      const parsedHtml = new JSDOM(embeddedObj.html);
      const document = parsedHtml.window.document;

      let textContent = document.querySelector('p').textContent;
      if (!textContent) {
        return;
      }

      const picIndex = textContent.indexOf('pic.twitter.com');
      if (picIndex !== -1) {
        textContent = textContent.substring(0, picIndex - 1);
      }
      const authorName =
        embeddedObj.author_name +
        ' (@' +
        embeddedObj.author_url.substring(
          embeddedObj.author_url.lastIndexOf('/') + 1
        ) +
        ')';
      const toSend = 'Tweet: ' + authorName + ': ' + textContent;
      clientService.say(toSend, channel);
    });
  }
}

export default TwitterTitle;
