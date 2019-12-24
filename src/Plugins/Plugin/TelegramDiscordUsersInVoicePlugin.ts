import TelegramClient from '../../ClientProtocols/TelegramClient';
import { IClientMessage } from '../../Types/ClientMessage';
import { IPluginInterface } from '../../Types/PluginInterface';
import PluginsController, { isPluginDisabled } from '../PluginsController';

const PLUGIN_NAME = 'PLUGIN_TELEGRAM_DISCORD_USERS_IN_VOICE';

const DISCORD_TARGET_CONFIG_NAME = 'SnekabelDiscord';
const TELEGRAM_TARGET_CONFIG_NAME = 'SnekabelTelegram';
class TelegramDiscordUsersInVoicePlugin implements IPluginInterface {
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
      messageObj.message.startsWith(trigger + 'discord') &&
      messageObj.clientService.config.name === TELEGRAM_TARGET_CONFIG_NAME
    ) {
      return true;
    }
    return false;
  }

  public trigger(messageObj: IClientMessage) {
    if (!this.supportsAction(messageObj)) {
      return;
    }
    const telegramService = messageObj.clientService as TelegramClient;

    const mainService = this.pluginsController.getMainService();
    const discordServices = mainService.getDiscordClientServices();
    const discordService = discordServices.find(
      (e) => e.config.name === DISCORD_TARGET_CONFIG_NAME
    );

    const usersInVoice = discordService.getUsersInVoiceChannelsMap();
    let toSay = 'Users in voice: ';
    let totalUsers = 0;
    usersInVoice.forEach((values: string[], key: string) => {
      toSay += key + ': ' + values.join(', ') + '. ';
      totalUsers++;
    });

    if (totalUsers > 0) {
      telegramService.say(toSay);
    }
  }
}

export default TelegramDiscordUsersInVoicePlugin;
