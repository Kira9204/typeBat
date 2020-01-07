import bodyParser from 'body-parser';
import express from 'express';
import MainService from '../index';
import { PROTOCOL } from '../Types/ClientMessage';
import { ITypeWebAPIConfig } from '../Types/TypeConfig';
import HangoutsClient from '../ClientProtocols/HangoutsClient';
import TelegramClient from '../ClientProtocols/TelegramClient';

const HANGOUTS_TARGET_CONFIG_NAME = 'SnekabelHangouts';
const TELEGRAM_TARGET_CONFIG_NAME = 'SnekabelTelegram';
class WebAPI {
  public mainService: MainService;
  public webApiConfig: ITypeWebAPIConfig;
  public hangoutsClient: HangoutsClient;
  public telegramClient: TelegramClient;
  public app: express.Application;
  public router: express.Router;

  constructor(mainService: MainService, webApiConfig: ITypeWebAPIConfig) {
    console.log('Creating a WebAPI service...');
    console.log('Port:', webApiConfig.port);
    console.log('Context:', webApiConfig.context);
    console.log('');
    this.mainService = mainService;
    this.webApiConfig = webApiConfig;
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.router = express.Router();

    this.handleRoutes = this.handleRoutes.bind(this);
    this.getHangoutsClient = this.getHangoutsClient.bind(this);
    this.getTelegramClient = this.getTelegramClient.bind(this);

    this.hangoutsClient = this.getHangoutsClient();
    //this.telegramClient = this.getTelegramClient();
    this.handleRoutes();
  }

  public getHangoutsClient() {
    const hangoutServices = this.mainService.getHangoutsServices();
    const hangoutService = hangoutServices.find(
      (e) => e.getClient().config.name === HANGOUTS_TARGET_CONFIG_NAME
    );
    if (!hangoutService) {
      console.log('WebAPI: Could not find target hangouts service');
      return;
    }
    return hangoutService;
  }

  public getTelegramClient() {
    const telegramServices = this.mainService.getTelegramClientServices();
    const telegramService = telegramServices.find(
      (e) => e.getClient().config.name === TELEGRAM_TARGET_CONFIG_NAME
    );
    if (!telegramService) {
      console.log('WebAPI: Could not find target telegram service');
      return;
    }
    return telegramService;
  }

  public handleRoutes() {
    const context = this.webApiConfig.context;
    const port = this.webApiConfig.port;

    const { router, app, hangoutsClient, telegramClient, mainService } = this;
    router.all(context, (req, res, next) => {
      console.log("I've received a request!");
      next();
    });

    router
      .post(context + '/say', (req, res) => {
        const protocol = req.body.protocol;
        const targetConfig = req.body.targetConfig;
        const channel = req.body.channel;
        const message = req.body.message;

        if (protocol === PROTOCOL.HANGOUTS) {
          const hangoutServices = mainService.getHangoutsServices();
          const hangoutService = hangoutServices.find(
            (e) => e.getClient().config.name === targetConfig
          );
          if (!hangoutService) {
            console.log('WebAPI say: Could not find target hangouts service');
            res.header('status', '400');
            res.send('Could not find Hangouts config');
            return;
          }

          hangoutService.say(message);
        } else if (protocol === PROTOCOL.DISCORD) {
          const discordServices = mainService.getDiscordClientServices();
          const discordService = discordServices.find(
            (e) => e.getClient().config.name === targetConfig
          );
          if (!discordService) {
            console.log('WebAPI say: Could not find target discord service');
            res.header('status', '400');
            res.send('Could not find Hangouts config');
            return;
          }
          discordService.say(message);
        } else if (protocol === PROTOCOL.TELEGRAM) {
          const telegramServices = mainService.getTelegramClientServices();
          const telegramService = telegramServices.find(
            (e) => e.getClient().config.name === targetConfig
          );
          if (!telegramService) {
            console.log('WebAPI say: Could not find target telegram service');
            res.header('status', '400');
            res.send('Could not find Hangouts config');
            return;
          }
          telegramService.say(message);
        } else if (protocol === PROTOCOL.IRC) {
          const ircServices = mainService.getIRCClientServices();
          const ircService = ircServices.find(
            (e) => e.getClient().config.name === targetConfig
          );
          if (!ircService) {
            console.log('WebAPI say: Could not find target discord service');
            res.header('status', '400');
            res.send('Could not find IRC config');
            return;
          }

          ircService.say(message, channel);
        }
      })
      .bind(this);

    router
      .post(context + '/gameserver/playerJoined', (req, res) => {
        console.log('Joined gameserver!');
        const line = req.body.username + ' joined ' + req.body.game + ' server';
        hangoutsClient.say(line);
        //telegramClient.say(line);
      })
      .bind(this);

    router
      .post(context + '/gameserver/playerDisconnected', (req, res) => {
        console.log('Left gameserver!');
        const line = req.body.username + ' left ' + req.body.game + ' server';
        hangoutsClient.say(line);
        //telegramClient.say(line);
      })
      .bind(this);

    app.use(router);
    app.listen(port);
  }
}

export default WebAPI;
