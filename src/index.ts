import DiscordClient from './ClientProtocols/DiscordClient';
import HangoutsClient from './ClientProtocols/HangoutsClient';
import IrcClient from './ClientProtocols/IrcClient';
import PluginsController from './Plugins/PluginsController';
import { VERSION } from './Constants';
import { ITypeConfig } from './Types/TypeConfig';
import WebAPI from './WebAPI/WebAPI';
import TelegramClient from './ClientProtocols/TelegramClient';
// @ts-ignore
import { CONFIG } from '../config';

class MainService {
  private readonly loadedConfig: ITypeConfig;
  private readonly pluginsController: PluginsController;
  private webApi: WebAPI;
  private ircServers: IrcClient[];
  private discordClients: DiscordClient[];
  private telegramClients: TelegramClient[];
  private hangoutsClients: HangoutsClient[];
  constructor() {
    console.log('========== STARTING NOBATv2 ==========');
    console.log('By: Erik Welander');
    console.log('Version: ' + VERSION);
    console.log('');

    this.loadIRCClientServices = this.loadIRCClientServices.bind(this);
    this.getIRCClientServices = this.getIRCClientServices.bind(this);
    this.loadDiscordClientServices = this.loadDiscordClientServices.bind(this);
    this.getDiscordClientServices = this.getDiscordClientServices.bind(this);
    this.loadTelegramClientServices = this.loadTelegramClientServices.bind(
      this
    );
    this.getTelegramClientServices = this.getTelegramClientServices.bind(this);
    this.loadHangoutsServices = this.loadHangoutsServices.bind(this);
    this.getHangoutsServices = this.getHangoutsServices.bind(this);

    console.log('Configuration: ', CONFIG);
    this.loadedConfig = CONFIG;
    if (!this.loadedConfig) {
      console.log('No configuration found! Aborting...');
      process.exit(1);
    }

    console.log('Loading Plugins...');
    this.pluginsController = new PluginsController(this);

    console.log('Adding client services...');
    this.ircServers = [];
    this.discordClients = [];
    this.telegramClients = [];
    this.hangoutsClients = [];
    this.loadIRCClientServices();
    this.loadDiscordClientServices();
    this.loadTelegramClientServices();
    this.loadHangoutsServices();

    if (this.loadedConfig.webapi && this.loadedConfig.webapi.enabled) {
      console.log('Adding WebAPI...');
      this.webApi = new WebAPI(this, this.loadedConfig.webapi);
    }
  }

  private loadIRCClientServices() {
    if (!this.loadedConfig.services.irc) {
      return;
    }
    this.ircServers = [];
    this.loadedConfig.services.irc.forEach((e) => {
      if (e.enabled) {
        this.ircServers.push(new IrcClient(e, this.pluginsController));
      }
    });
  }

  public getIRCClientServices() {
    return this.ircServers;
  }

  private loadDiscordClientServices() {
    if (!this.loadedConfig.services.discord) {
      return;
    }
    this.discordClients = [];
    this.loadedConfig.services.discord.forEach((e) => {
      if (e.enabled) {
        this.discordClients.push(new DiscordClient(e, this.pluginsController));
      }
    });
  }

  public getDiscordClientServices() {
    return this.discordClients;
  }

  private loadTelegramClientServices() {
    if (!this.loadedConfig.services.telegram) {
      return;
    }
    this.telegramClients = [];
    this.loadedConfig.services.telegram.forEach((e) => {
      if (e.enabled) {
        this.telegramClients.push(
          new TelegramClient(e, this.pluginsController)
        );
      }
    });
  }
  public getTelegramClientServices() {
    return this.telegramClients;
  }

  private loadHangoutsServices() {
    if (!this.loadedConfig.services.hangouts) {
      return;
    }

    this.hangoutsClients = [];
    this.loadedConfig.services.hangouts.forEach((e) => {
      if (e.enabled) {
        this.hangoutsClients.push(
          new HangoutsClient(e, this.pluginsController)
        );
      }
    });
  }

  public getHangoutsServices() {
    return this.hangoutsClients;
  }
}

export default MainService;
new MainService();
