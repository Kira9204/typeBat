import MainService from '../index';
import { IClientMessage, IClientService } from '../Types/ClientMessage';
import { IPluginInterface } from '../Types/PluginInterface';

const reRequire = require('re-require-module').reRequire;

export const isPluginDisabled = (
  clientService: IClientService,
  channel: string,
  pluginName: string
) => {
  if (!clientService.config.disabledPlugins) {
    return false;
  }
  let isDisabled = false;
  clientService.config.disabledPlugins.forEach((e) => {
    if (e.channel === channel && e.plugins.includes(pluginName)) {
      isDisabled = true;
    }
  });
  return isDisabled;
};

class PluginsController {
  private readonly mainService: MainService;
  private plugins: IPluginInterface[];

  constructor(mainService: MainService) {
    this.mainService = mainService;
    this.plugins = [];

    this.loadPlugins = this.loadPlugins.bind(this);
    this.trigger = this.trigger.bind(this);
    this.getMainService = this.getMainService.bind(this);

    this.loadPlugins();
  }

  public loadPlugins() {
    this.plugins = [
      new (reRequire('./Plugin/HelpPlugin')).default(this),
      new (reRequire('./Plugin/ReloadPlugin')).default(this),
      new (reRequire('./Plugin/WebTitle/WebTitlePlugin')).default(this),
      new (reRequire('./Plugin/HangoutsDiscordUsersInVoicePlugin')).default(
        this
      ),
      new (reRequire('./Plugin/HangoutsDiscordVoiceParticipationPlugin')).default(
        this
      ),
      new (reRequire('./Plugin/TelegramDiscordUsersInVoicePlugin')).default(
        this
      ),
      new (reRequire('./Plugin/TelegramDiscordVoiceParticipationPlugin')).default(
        this
      )
    ];
  }

  public trigger(messageObj: IClientMessage) {
    this.plugins.forEach((e) => {
      e.trigger(messageObj);
    });
  }

  public getMainService() {
    return this.mainService;
  }
}

export default PluginsController;
