// @ts-ignore No types provided for hangupsjs
import Client from 'hangupsjs';
import Q from 'q';
import PluginsController from '../Plugins/PluginsController';

//Types
import { IClientMessage, MSG_TYPE, PROTOCOL } from '../Types/ClientMessage';
import { IClientProtocol } from '../Types/ClientProtocolInterface';
import { ITypeHangoutsServiceConfig } from '../Types/TypeConfig';

const EVT_TEXT_MESSAGE = 'chat_message';
const EVT_CONNECT_FAILED = 'connect_failed';

class HangoutsClient implements IClientProtocol {
  public config: ITypeHangoutsServiceConfig;
  private client: any;
  private pluginsController: PluginsController;
  private myId: string;
  private lastMsgChannelId: string;

  constructor(
    clientConfig: ITypeHangoutsServiceConfig,
    pluginsController: PluginsController
  ) {
    console.log('Creating a new Hangouts service...');
    console.log('Trigger:', clientConfig.trigger);
    console.log('GaiaId:', clientConfig.gaiaId);
    console.log('channelId:', clientConfig.targetChannelId);
    console.log('Cookies":', clientConfig.cookies);
    console.log('');

    this.config = clientConfig;
    this.pluginsController = pluginsController;

    this.client = new Client();
    this.myId = clientConfig.gaiaId;
    this.lastMsgChannelId = '';

    this.connect = this.connect.bind(this);
    this.onChannelMessage = this.onChannelMessage.bind(this);
    this.say = this.say.bind(this);
    this.getClient = this.getClient.bind(this);

    this.connect();
  }

  public connect() {
    const cookies = this.config.cookies;
    const getCookiesObj = () => {
      const creds = function() {
        return Q({
          cookies
        });
      };

      return creds;
    };
    const reconnect = () => {
      this.client.disconnect();
      this.client
        .connect(getCookiesObj())
        .then(() => {
          console.log('Hangouts: Logged in!');
        })
        .done();
    };

    this.client.on(EVT_TEXT_MESSAGE, this.onChannelMessage);
    this.client.on(EVT_CONNECT_FAILED, (err: Error) => {
      console.log('Hangouts error', err);
      reconnect();
    });

    this.client
      .connect(getCookiesObj())
      .then(() => {
        console.log('Hangouts: Logged in!');
      })
      .done();
  }

  // This library is a complete mystery to me, but it is also the only library
  // that still works by circumventing google's bot locks.
  public onChannelMessage(ev: any) {
    let msg = '';
    let gaiaId = '';
    this.lastMsgChannelId = ev.conversation_id.id;

    try {
      const msgArr: any[] = [];
      ev.chat_message.message_content.segment.forEach((e: { text: any }) => {
        if (e.text) {
          msgArr.push(e.text);
        }
      });
      msg = msgArr.join(' ');
    } catch (e) {
      console.log('MSG ERROR', e);
      return;
    }
    try {
      gaiaId = ev.sender_id.gaia_id;
    } catch (e) {
      console.log('gaia_id ERROR!', e);
    }

    if (!msg || gaiaId === this.myId) {
      return;
    }

    const msgObj: IClientMessage = {
      channel: this.lastMsgChannelId,
      clientService: this,
      message: msg,
      protocol: PROTOCOL.HANGOUTS,
      type: MSG_TYPE.MESSAGE
    };

    this.pluginsController.trigger(msgObj);
  }

  public say(message: string, to?: string | null) {
    const channelId = to ? to : this.config.targetChannelId;
    this.client.sendchatmessage(channelId, [[0, message]]);
  }

  public getClient() {
    return this;
  }
}

export default HangoutsClient;
