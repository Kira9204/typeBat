'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * Service config examples:
 {
 *webapi: {
    enabled: false,
    port: 3002,
    context: '/api/v1'
  },
 * services: {
    irc: [ //A list of IRC services (servers) to join
      {
        enabled: false,
        name: 'OFTC IRC', //Identifies this service when making cross-talk plugins etc.
        trigger: '!',
        host: 'irc.oftc.net',
        port: 6697,
        secure: true,     //Use TLS/SSL when connecting?
        nick: 'github-typebat',
        channels: ['#ix'],    //A list of channels to join
        disabledPlugins: [
          {
            channel: '#ix',
            plugins: ['PLUGIN_WEB_TITLE']
          }
        ]
        ignoreUsers: ['user nick']
      }
    ],
    discord: [  //You can log in with multible discord users at the same time, altho it is discuraged
      {
        enabled: true,
        name: 'SnekabelDiscord',   //Identifies this service when making cross-talk plugins etc.
        trigger: '!',
        token: '',  //Check your browser for this token
        //A pre-defined channel for all text communication.
        //By default the bot will answer to all commands from all channels, but you can also jail the bot to this
        //channel.
        //This is indented to be the "default" channel for plugins etc that uses the discord service
        targetChannelId: '',
        //Same deal as the above one
        targetVoiceChannelId: '',
        disabledPlugins: [
          {
            channel: '444', //Channel ID
            plugins: ['PLUGIN_WEB_TITLE'] //A list of plugin names
          }
        ],
        ignoreUsers: ['444'] //A list of user IDs
      }
    ],

     "telegram": [{
      "enabled": false,
      "name": "SnekabelTelegram",   //Identifies this service when making cross-talk plugins etc.
      "trigger": "!",
      "token": "",   //A provided bot token by the botfather
      //Same rules as discord for these
      "targetChannelId": "",
      "disabledPlugins": [],
      "ignoreUsers": []
    }],

    "hangouts": [{
      "enabled": false,
      "name": "SnekabelHangouts",   //Identifies this service when making cross-talk plugins etc.
      "trigger": "!",
      "cookies": [  //These cookies needs to be copied from the browser
        "NID=...Expires=2019-05-08T19:22:51.195Z; Domain=google.com; Path=/; HttpOnly",
        "SID=...Expires=2020-11-05T19:22:51.194Z; Domain=google.com; Path=/",
        "HSID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com; Path=/; HttpOnly; Priority=HIGH",
        "SSID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com;  Path=/; Secure; HttpOnly; Priority=HIGH",
        "APISID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com; Path=/; Priority=HIGH",
        "SAPISID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com; Path=/; Secure; Priority=HIGH"
      ],
      "gaiaId": "",  //Your user ID, best way to find this is by logging the incoming messages
      //See discord for these
      "targetChannelId": "",
      "disabledPlugins": [],
      "ignoreUsers": []
    }]
    }
 */

exports.CONFIG = {
  webapi: {
    enabled: false,
    port: 3002,
    context: '/api/v1'
  },
  services: {
    irc: [
      {
        enabled: true,
        name: 'OFTC IRC',
        trigger: '!',
        host: 'irc.oftc.net',
        port: 6697,
        secure: true,
        nick: 'typeBat-github',
        channels: ['#ix'],
        disabledPlugins: [],
        ignoreUsers: []
      }
    ],
    discord: [
      {
        enabled: true,
        name: 'SnekabelDiscord',
        trigger: '!',
        token: '',
        targetChannelId: '',
        targetVoiceChannelId: '',
        disabledPlugins: [
          {
            channel: '',
            plugins: ['PLUGIN_WEB_TITLE']
          }
        ],
        ignoreUsers: ['123']
      }
    ],
    telegram: [
      {
        enabled: false,
        name: 'SnekabelTelegram',
        trigger: '!',
        token: '',
        targetChannelId: '',
        disabledPlugins: [],
        ignoreUsers: []
      }
    ],
    hangouts: [
      {
        enabled: false,
        name: 'SnekabelHangouts',
        trigger: '!',
        cookies: [
          'NID=...Expires=2019-05-08T19:22:51.195Z; Domain=google.com; Path=/; HttpOnly',
          'SID=...Expires=2020-11-05T19:22:51.194Z; Domain=google.com; Path=/',
          'HSID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com; Path=/; HttpOnly; Priority=HIGH',
          'SSID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com;  Path=/; Secure; HttpOnly; Priority=HIGH',
          'APISID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com; Path=/; Priority=HIGH',
          'SAPISID=...Expires=2020-11-05T19:22:51.195Z; Domain=google.com; Path=/; Secure; Priority=HIGH'
        ],
        gaiaId: '',
        targetChannelId: '',
        disabledPlugins: [],
        ignoreUsers: []
      }
    ]
  }
};
