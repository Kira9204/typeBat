import { IClientMessage, MSG_TYPE } from '../../Types/ClientMessage';
import { IPluginInterface } from '../../Types/PluginInterface';
import PluginsController, { isPluginDisabled } from '../PluginsController';

const PLUGIN_NAME = 'PLUGIN_TELEGRAM_DISCORD_USERS_VOICE_PARTICIPATION';
const DISCORD_TARGET_CONFIG_NAME = 'SnekabelDiscord';
const TELEGRAM_TARGET_CONFIG_NAME = 'SnekabelTelegram';
class TelegramDiscordVoiceParticipationPlugin implements IPluginInterface {
  public pluginsController: PluginsController;

  constructor(pluginsController: PluginsController) {
    this.pluginsController = pluginsController;

    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(messageObj: IClientMessage) {
    const trigger = messageObj.clientService.config.trigger;
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
    const telegramServices = mainService.getTelegramClientServices();
    const telegramService = telegramServices.find(
      (e) => e.getClient().config.name === TELEGRAM_TARGET_CONFIG_NAME
    );
    if (!telegramService) {
      console.log(
        'TelegramDiscordVoiceParticipationPlugin: Could not find target telegram service'
      );
      return;
    }

    telegramService.say(messageObj.message);
  }
}

export default TelegramDiscordVoiceParticipationPlugin;
