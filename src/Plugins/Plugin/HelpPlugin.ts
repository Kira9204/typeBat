import { BOT_NAME } from '../../Constants';
import { IClientMessage } from '../../Types/ClientMessage';
import { IPluginInterface } from '../../Types/PluginInterface';
import { isPluginDisabled } from '../PluginsController';

const PLUGIN_NAME = 'PLUGIN_HELP';
class HelpPlugin implements IPluginInterface {
  constructor() {
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(messageObj: IClientMessage) {
    return !isPluginDisabled(
      messageObj.clientService,
      messageObj.channel,
      PLUGIN_NAME
    );
  }

  public trigger(messageObj: IClientMessage) {
    if (!this.supportsAction(messageObj)) {
      return false;
    }

    const trigger = messageObj.clientService.config.trigger;
    const service = messageObj.clientService;
    const channel = messageObj.channel;
    if (
      messageObj.message === `${trigger}help` ||
      messageObj.message === `${trigger}about`
    ) {
      service.say(
        `Hello! I am ${BOT_NAME}. I'm a Hangouts <-> Discord <-> IRC bridge built in typescript by Kira9204.`,
        channel
      );
      service.say(
        `I also give detailed information about everything from youtube/vimeo/twitch/SVT links to webhallen/tradera/blocket links posted in this chat, and handles radio and music playback as well!`,
        channel
      );
    }
  }
}

export default HelpPlugin;
