import { IClientMessage } from '../../Types/ClientMessage';
import { IPluginInterface } from '../../Types/PluginInterface';
import PluginsController, { isPluginDisabled } from '../PluginsController';

const PLUGIN_NAME = 'PLUGIN_RELOAD';
class ReloadPlugin implements IPluginInterface {
  public pluginsController: PluginsController;

  constructor(pluginsController: PluginsController) {
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
    this.pluginsController = pluginsController;
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
    if (messageObj.message === `${trigger}reloadplugins`) {
      this.pluginsController.loadPlugins();
      messageObj.clientService.say('Reloaded plugins!', messageObj.channel);
    }
  }
}

export default ReloadPlugin;
