import { IClientMessage, MSG_TYPE } from '../../Types/ClientMessage';
import { IPluginInterface } from '../../Types/PluginInterface';
import PluginsController, { isPluginDisabled } from '../PluginsController';

const PLUGIN_NAME = 'PLUGIN_HANGOUTS_DISCORD_USERS_VOICE_PARTICIPATION';
const DISCORD_TARGET_CONFIG_NAME = 'SnekabelDiscord';
const HANGOUTS_TARGET_CONFIG_NAME = 'SnekabelHangouts';
class HangoutsDiscordVoiceParticipationPlugin implements IPluginInterface {
  public pluginsController: PluginsController;

  constructor(pluginsController: PluginsController) {
    this.pluginsController = pluginsController;

    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(messageObj: IClientMessage) {
    if (
      isPluginDisabled(
        messageObj.clientService,
        messageObj.channel,
        PLUGIN_NAME
      )
    ) {
      return false;
    } else if (
      (messageObj.type === MSG_TYPE.USER_JOINED_VOICE ||
        messageObj.type === MSG_TYPE.USER_LEFT_VOICE) &&
      messageObj.clientService.config.name === DISCORD_TARGET_CONFIG_NAME
    ) {
      return true;
    }
    return false;
  }

  public trigger(messageObj: IClientMessage) {
    if (!this.supportsAction(messageObj)) {
      return;
    }

    const mainService = this.pluginsController.getMainService();
    const hangoutServices = mainService.getHangoutsServices();
    const hangoutService = hangoutServices.find(
      (e) => e.getClient().config.name === HANGOUTS_TARGET_CONFIG_NAME
    );
    if (!hangoutService) {
      console.log(
        'HangoutsDiscordUsersInVoicePlugin: Could not find target hangouts service'
      );
      return;
    }

    hangoutService.say(messageObj.message);
  }
}

export default HangoutsDiscordVoiceParticipationPlugin;
