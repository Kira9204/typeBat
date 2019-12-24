export interface IClientProtocol {
  connect: Function;
  onChannelMessage: Function;
  onPmMessage?: Function;
  onUserJoined?: Function;
  onUserQuit?: Function;
  say: Function;
  playSound?: Function;
  getClient: Function;
}
