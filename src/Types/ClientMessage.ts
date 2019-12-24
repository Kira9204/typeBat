import DiscordClient from '../ClientProtocols/DiscordClient';
import HangoutsClient from '../ClientProtocols/HangoutsClient';
import IrcClient from '../ClientProtocols/IrcClient';
import TelegramClient from '../ClientProtocols/TelegramClient';

export enum MSG_TYPE {
  MESSAGE = 'MESSAGE',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  USER_JOINED_VOICE = 'USER_JOINED_VOICE',
  USER_LEFT_VOICE = 'USER_LEFT_VOICE',
  PM = 'PM'
}

export enum PROTOCOL {
  IRC = 'IRC',
  DISCORD = 'DISCORD',
  HANGOUTS = 'HANGOUTS',
  TELEGRAM = 'TELEGRAM'
}

export type IClientService = IrcClient | DiscordClient | HangoutsClient | TelegramClient;
export interface IClientMessage {
  type: MSG_TYPE;
  protocol: PROTOCOL;
  clientService: IClientService;
  channel: string;
  message: string;
  // Request shorter messages
  isSmallMessage?: boolean;
}
