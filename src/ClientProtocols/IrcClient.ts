import irc from 'irc';
import PluginsController from '../Plugins/PluginsController';
import { IClientMessage, MSG_TYPE, PROTOCOL } from '../Types/ClientMessage';
import { IClientProtocol } from '../Types/ClientProtocolInterface';
import { ITypeIRCServiceConfig } from '../Types/TypeConfig';

const EVT_TEXT_MESSAGE = 'message';
const EVT_USER_JOINED = 'join';
const EVT_USER_REMOVE = 'part';
const EVT_ERROR = 'error';
const EVT_PM = 'pm';

class IrcClient implements IClientProtocol {
  public config: ITypeIRCServiceConfig;
  private client: irc.Client;
  private pluginsController: PluginsController;

  constructor(
    clientConfig: ITypeIRCServiceConfig,
    pluginsController: PluginsController
  ) {
    console.log('Creating a new IRC service...');
    console.log('Trigger:', clientConfig.trigger);
    console.log('Nick:', clientConfig.nick);
    console.log('Hostname:', clientConfig.host);
    console.log('Port:', clientConfig.port);
    console.log('Channels:', clientConfig.channels);
    console.log('');

    this.config = clientConfig;
    this.pluginsController = pluginsController;

    this.onChannelMessage = this.onChannelMessage.bind(this);
    this.onPmMessage = this.onPmMessage.bind(this);
    this.onUserJoined = this.onUserJoined.bind(this);
    this.onUserQuit = this.onUserQuit.bind(this);
    this.say = this.say.bind(this);
    this.getClient = this.getClient.bind(this);

    this.connect();
  }

  public connect() {
    this.client = new irc.Client(this.config.host, this.config.nick, {
      port: this.config.port,
      secure: this.config.secure,
      channels: this.config.channels
    });

    this.client.addListener(EVT_TEXT_MESSAGE, this.onChannelMessage);
    this.client.addListener(EVT_PM, this.onPmMessage);
    this.client.addListener(EVT_USER_JOINED, this.onUserJoined);
    this.client.addListener(EVT_USER_REMOVE, this.onUserQuit);
    this.client.addListener(EVT_ERROR, (error) => {
      console.log('ircClient: ERROR: ' + error);
    });
  }

  public onChannelMessage(from: string, channel: string, text: string) {
    if (from === this.config.nick || this.config.ignoreUsers.includes(from)) {
      return;
    }
    const msgObj: IClientMessage = {
      channel,
      clientService: this,
      message: text,
      protocol: PROTOCOL.IRC,
      type: MSG_TYPE.MESSAGE
    };
    this.pluginsController.trigger(msgObj);
  }

  public onPmMessage(from: string, text: string, message: irc.IMessage) {
    if (from === this.config.nick || this.config.ignoreUsers.includes(from)) {
      return;
    }

    this.say('I do not support PMs', from);
  }

  public onUserJoined(channel: string, nick: string, userObj: any) {
    const msgObj: IClientMessage = {
      channel,
      clientService: this,
      message: `User ${nick} joined ${channel}`,
      protocol: PROTOCOL.IRC,
      type: MSG_TYPE.USER_JOINED
    };
    this.pluginsController.trigger(msgObj);
  }

  public onUserQuit(channel: string, nick: string, i: any, userObj: any) {
    const msgObj: IClientMessage = {
      channel,
      clientService: this,
      message: `User ${nick} left ${channel}`,
      protocol: PROTOCOL.IRC,
      type: MSG_TYPE.USER_LEFT
    };
    this.pluginsController.trigger(msgObj);
  }

  public say(message: string, to: string) {
    if (!to) {
      console.log('ircClient: No destination channel?', message, to);
      return;
    }
    this.client.say(to, message);
  }

  public getClient() {
    return this;
  }
}
export default IrcClient;
