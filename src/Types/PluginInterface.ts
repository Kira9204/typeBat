import { IClientMessage, IClientService } from './ClientMessage';

export interface IPluginInterface {
  supportsAction: (messageObj: IClientMessage) => void;
  trigger: (messageObj: IClientMessage) => void;
}

export interface IPluginChildInterface {
  supportsAction: (
    message: string,
    channel: string,
    clientService: IClientService,
    smallMessage: boolean
  ) => boolean;
  trigger: (
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) => void;
}
