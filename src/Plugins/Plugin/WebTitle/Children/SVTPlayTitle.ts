import * as webService from '../../../../Services/WebService';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';

const constructModel = (data: string) => {
  const obj = JSON.parse(data);

  const showTitle = obj.programTitle;
  const episodeTitle = obj.episodeTitle;
  const showDuration = obj.contentDuration;

  const hours = Math.round((showDuration / 3600) % 24);
  const minutes = Math.round((showDuration / 60) % 60);
  const seconds = Math.round(showDuration % 60);

  let duration = '';
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
    duration,
    episodeTitle,
    showTitle
  };
};

class SVTPlayTitle implements IPluginChildInterface {
  constructor() {
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    return webService.REGEXP.SVT.test(message);
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    if (!this.supportsAction(message, channel, clientService)) {
      return;
    }

    webService
      .downloadPageDom(message)
      .then((dom) => {
        if (!dom) {
          return;
        }
        const videoEl = dom.window.document.querySelector(
          'video[data-video-id]'
        );
        if (!videoEl) {
          return;
        }
        const attr = videoEl.getAttribute('data-video-id');
        if (!attr) {
          return;
        }
        return attr;
      })
      .catch((e) => {})
      .then((data: string) => {
        const svtRequest = `http://www.svt.se/videoplayer-api/video/${data}`;
        webService
          .downloadPage(svtRequest)
          .then((data2: string) => {
            const videoData = constructModel(data2);
            const retString = `Show: ${videoData.showTitle}. Episode: ${videoData.episodeTitle}. Duration: ${videoData.duration}.`;

            clientService.say(retString, channel);
          })
          .catch((e) => {});
      });
  }
}

export default SVTPlayTitle;
