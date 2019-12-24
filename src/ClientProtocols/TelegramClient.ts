import TelegramBot from 'node-telegram-bot-api';
import { IClientProtocol } from '../Types/ClientProtocolInterface';
import { ITypeTelegramServiceConfig } from '../Types/TypeConfig';
import PluginsController from '../Plugins/PluginsController';
import { IClientMessage, MSG_TYPE, PROTOCOL } from '../Types/ClientMessage';

const EVT_TEXT_MESSAGE = 'message';
class TelegramClient implements IClientProtocol {
  public config: ITypeTelegramServiceConfig;
  private client: TelegramBot;
  private pluginsController: PluginsController;
  private readonly trigger: string;
  private lastMsgChannelId: number;
  constructor(
    clientConfig: ITypeTelegramServiceConfig,
    pluginsController: PluginsController
  ) {
    console.log('Creating a new Telegram service...');
    console.log('Trigger:', clientConfig.trigger);
    console.log('Token:', clientConfig.token);
    console.log('TargetChannelId":', clientConfig.targetChannelId);
    console.log('');
    this.config = clientConfig;
    this.pluginsController = pluginsController;
    this.lastMsgChannelId = 0;
    this.connect = this.connect.bind(this);
    this.onChannelMessage = this.onChannelMessage.bind(this);
    this.onPmMessage = this.onPmMessage.bind(this);
    this.say = this.say.bind(this);
    this.getClient = this.getClient.bind(this);
    this.connect();
  }
  public connect() {
    this.client = new TelegramBot(this.config.token, { polling: true });
    this.client.on(EVT_TEXT_MESSAGE, this.onChannelMessage);
  }

  public onChannelMessage(messageData: TelegramBot.Message) {
    if (
      messageData.from.is_bot ||
      this.config.ignoreUsers.includes('' + messageData.from.id) ||
      !messageData.text
    ) {
      return;
    }
    if (messageData.chat.type === 'private') {
      return this.onPmMessage(messageData);
    }
    this.lastMsgChannelId = messageData.from.id;

    const msgObj: IClientMessage = {
      channel: '' + messageData.chat.id,
      clientService: this,
      message: messageData.text,
      protocol: PROTOCOL.TELEGRAM,
      type: MSG_TYPE.MESSAGE,
      isSmallMessage: true
    };
    this.pluginsController.trigger(msgObj);
  }

  public onPmMessage(messageData: TelegramBot.Message) {
    return;
  }

  public say(message: string, to?: string | null) {
    if (!to && this.lastMsgChannelId === 0) {
      return;
    }
    const channelId = to ? to: this.config.targetChannelId;
    this.client.sendMessage(channelId, message);
  }

  public getClient() {
    return this;
  }
}

export default TelegramClient;
