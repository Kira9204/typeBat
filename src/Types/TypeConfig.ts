export interface ITypeConfig {
  webapi?: ITypeWebAPIConfig;
  services: {
    irc?: ITypeIRCServiceConfig[];
    discord?: ITypeDiscordServiceConfig[];
    hangouts?: ITypeHangoutsServiceConfig[];
    telegram?: ITypeTelegramServiceConfig[];
  };
}

export interface ITypeWebAPIConfig {
  enabled: boolean;
  port: number;
  context: string;
}

export interface IDisabledPlugin {
  channel: string;
  plugins: string[];
}
export interface ITypeIRCServiceConfig {
  enabled: boolean;
  name: string;
  trigger: string;
  host: string;
  port: number;
  secure?: boolean,
  nick: string;
  channels: string[];
  disabledPlugins: IDisabledPlugin[];
  ignoreUsers: string[];
}

export interface ITypeDiscordServiceConfig {
  enabled: boolean;
  name: string;
  trigger: string;
  token: string;
  targetChannelId: string;
  targetVoiceChannelId: string;
  disabledPlugins: IDisabledPlugin[];
  ignoreUsers: string[];
}

export interface ITypeTelegramServiceConfig {
  enabled: boolean;
  name: string;
  trigger: string;
  token: string;
  targetChannelId: string;
  disabledPlugins: IDisabledPlugin[];
  ignoreUsers: string[];
}


export interface ITypeHangoutsServiceConfig {
  enabled: boolean;
  name: string;
  trigger: string;
  cookies: [
    string, // NID
    string, // SID
    string, // HSID
    string, // SSID
    string, // APISID
    string // SAPISID
  ];
  gaiaId: string; // Your account id
  targetChannelId: string; // Debug incoming messages for this one
  disabledPlugins: IDisabledPlugin[];
  ignoreUsers: string[];
}
