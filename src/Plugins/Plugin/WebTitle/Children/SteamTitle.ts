import * as webService from '../../../../Services/WebService';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';

interface ISteamData {
  name: string;
  price: string;
  currency: string;
  discount: string;
  recommendations: string;
}

const constructModel = (data: string, gameId: string): ISteamData | boolean => {
  let gameData = JSON.parse(data);
  gameData = gameData[gameId];
  if (!gameData.success) {
    return false;
  }
  gameData = gameData.data;

  const name = gameData.name;
  let price = gameData.price_overview.final.toString();
  const currency = gameData.price_overview.currency;
  const discount = gameData.price_overview.discount_percent;
  let recommendations = 0;
  if (
    gameData.recommendations != null &&
    gameData.recommendations.total !== undefined
  ) {
    recommendations = gameData.recommendations.total;
  }

  if (price.length === 5) {
    let tmpPrice = price.substring(0, 3);
    tmpPrice += ',';
    tmpPrice += price.substring(3);
    price = tmpPrice;
  } else if (price.length === 4) {
    let tmpPrice = price.substring(0, 2);
    tmpPrice += ',';
    tmpPrice += price.substring(2);
    price = tmpPrice;
  } else if (price.length === 3) {
    let tmpPrice = price.substring(0, 1);
    tmpPrice += ',';
    tmpPrice += price.substring(1);
    price = tmpPrice;
  } else if (price.length === 2) {
    price = '0,' + price;
  }
  price += ' ' + currency;

  return {
    name,
    price,
    currency,
    discount,
    recommendations: new Intl.NumberFormat('sv-SE').format(recommendations)
  };
};

class SteamTitle implements IPluginChildInterface {
  constructor() {
    this.supportsAction = this.supportsAction.bind(this);
    this.getAppId = this.getAppId.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    return webService.REGEXP.STEAM.test(message);
  }

  public getAppId(input: string) {
    const match = webService.REGEXP.STEAM.exec(input);
    if (match == null || match[1] === undefined) {
      return false;
    }
    return match[1];
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService
  ) {
    if (
      !this.supportsAction(message, channel, clientService) ||
      !this.getAppId(message)
    ) {
      return;
    }

    const gameId = this.getAppId(message);
    if (!gameId) {
      return;
    }
    const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${gameId}&cc=SV`;
    webService.downloadPage(apiUrl).then(
      function(data: string) {
        const gameInfo = constructModel(data, gameId);
        if (!gameInfo) {
          return false;
        }

        // @ts-ignore
        let retString = `Title: ${gameInfo.name}`;
        // @ts-ignore
        if (gameInfo.discount > 0) {
          // @ts-ignore
          retString += ` Price: ${gameInfo.price} (${gameInfo.discount}% off!).`;
        } else {
          // @ts-ignore
          retString += ` Price: ${gameInfo.price}.`;
        }
        // @ts-ignore
        retString += ` Recommendations: ${gameInfo.recommendations}.`;

        clientService.say(retString, channel);
      }.bind(this)
    ).catch(e => {});
  }
}

export default SteamTitle;
