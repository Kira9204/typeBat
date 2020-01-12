import * as webLib from '../../../../Libs/WebLib';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { formatNumber } from './PriceFormatter';

const SUPPORTED_DOMAINS: { [key: string]: string } = {
  m_blocket_se: 'm.blocket.se',
  www_blocket_se: 'www.blocket.se',
  www_webhallen_com: 'www.webhallen.com',
  www_inet_se: 'www.inet.se',
  cdon_se: 'cdon.se',
  www_tradera_com: 'www.tradera.com',
  www_clasohlson_com: 'www.clasohlson.com',
  www_biltema_se: 'www.biltema.se',
  www_komplett_se: 'www.komplett.se',
  www_ikea_com: 'www.ikea.com',
  www_twostroke_se: 'www.twostroke.se',
  www_jula_se: 'www.jula.se'
};

const replaceUrl = (url: string) => {
  if (url.startsWith('https://m.blocket.se')) {
    return url.replace('https://m.blocket.se', 'https://www.blocket.se');
  }
  return url;
};

class PriceTitle implements IPluginChildInterface {
  constructor() {
    this.supportsAction = this.supportsAction.bind(this);
    this.trigger = this.trigger.bind(this);
    this.handleDomain = this.handleDomain.bind(this);
  }

  public supportsAction(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    const parsedUrl = webLib.parseUrl(message);
    const hostname = parsedUrl.hostname;

    for (const key in SUPPORTED_DOMAINS) {
      if (hostname === (SUPPORTED_DOMAINS[key] as string)) {
        return true;
      }
    }
    return false;
  }

  public trigger(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    if (!this.supportsAction(message, channel, clientService, isSmallMessage)) {
      return;
    }
    message = replaceUrl(message);
    this.handleDomain(message, channel, clientService, isSmallMessage);
  }

  public handleDomain(
    message: string,
    channel: string,
    clientService: IClientService,
    isSmallMessage: boolean
  ) {
    const parsedUrl = webLib.parseUrl(message);
    const hostname = parsedUrl.hostname;

    webLib
      .downloadPageDom(message)
      .then((dom) => {
        if (!dom) {
          return;
        }
        const document = dom.window.document;
        let title = '';
        if (!isSmallMessage) {
          title = document.querySelector('title').text;
          title = webLib.cleanDecodeString(title);
          title = 'Title: ' + title + '. ';
        }

        switch (hostname) {
          case SUPPORTED_DOMAINS.www_tradera_com:
            (() => {
              title = title.substring(0, title.lastIndexOf('(') - 1);
              const foundFixedPriceEl = document.querySelector(
                '#view-item-main > div.view-item-details.view-item-details-bids > article > section > section.view-item-type-wrapper.view-item-bin-on-auction > div > form > button'
              );
              const foundBiddingPriceEl = document.querySelector(
                '#view-item-main > div.view-item-details.view-item-details-bids > article > div > ul > li:nth-child(1) > span.view-item-bidding-details-amount > span'
              );
              const foundBiddingInitialPriceEl = document.querySelector(
                '#view-item-main > div.view-item-details.view-item-details-bids > article > div > ul > li:nth-child(1) > span:nth-child(2)'
              );
              const foundTimeLeftEl = document.querySelector(
                '#view-item-main > div.view-item-details.view-item-details-bids > article > div > ul > li:nth-child(2) > span.view-item-details-time-critical'
              );
              const foundTimeLeftInitialEl = document.querySelector(
                '#view-item-main > div.view-item-details.view-item-details-bids > article > div > ul > li:nth-child(2) > span:nth-child(2)'
              );

              let titleText = title;
              if (foundBiddingPriceEl || foundBiddingInitialPriceEl) {
                const el = foundBiddingPriceEl || foundBiddingInitialPriceEl;
                let text = el.textContent;
                text = webLib.cleanDecodeString(text);
                titleText += 'Leading bid: ' + text + ' kr';
              }
              if (foundFixedPriceEl) {
                let text = foundFixedPriceEl.textContent;
                text = webLib.cleanDecodeString(text);
                text = text.substring(text.indexOf(':') + 2);
                titleText += '. Buy now: ' + text;
              }
              if (foundTimeLeftEl || foundTimeLeftInitialEl) {
                const el = foundTimeLeftEl || foundTimeLeftInitialEl;
                let text = el.textContent;
                text = webLib.cleanDecodeString(text);
                text = text.replace('dag', 'day');
                text = text.replace('dagar', 'days');
                text = text.replace('tim', 'hours');
                text = text.replace('min', 'minutes');
                titleText += '. Time left: ' + text;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.m_blocket_se:
          case SUPPORTED_DOMAINS.www_blocket_se:
            (() => {
              const priceEl = document.querySelector(
                '#skip-tabbar > div.MediumLayout__CenterWithPadding-y8zw9h-4.dLRLhZ > div.MediumLayout__BodyWrapper-y8zw9h-0.hcOKjg > div.MediumLayout__BodyLeft-y8zw9h-2.ggElfM > article > div:nth-child(1) > div.Hero__ContentWrapper-sc-1mjgwl-3.cJVGaa > div.TextHeadline1__TextHeadline1Wrapper-sc-18mtyla-0.beSmCZ.Price__StyledPrice-crp2x0-0.cfhypK'
              );
              const publishedEL = document.querySelector(
                '#skip-tabbar > div.MediumLayout__CenterWithPadding-y8zw9h-4.dLRLhZ > div.MediumLayout__BodyWrapper-y8zw9h-0.hcOKjg > div.MediumLayout__BodyLeft-y8zw9h-2.ggElfM > article > div:nth-child(1) > div.Hero__ContentWrapper-sc-1mjgwl-3.cJVGaa > div.Hero__AdInfo-sc-1mjgwl-0.dzAsG > div:nth-child(1) > div > span'
              );
              const areaEl = document.querySelector(
                '#skip-tabbar > div.MediumLayout__CenterWithPadding-y8zw9h-4.dLRLhZ > div.MediumLayout__BodyWrapper-y8zw9h-0.hcOKjg > div.MediumLayout__BodyLeft-y8zw9h-2.ggElfM > article > div:nth-child(1) > div.Hero__ContentWrapper-sc-1mjgwl-3.cJVGaa > div.Hero__AdInfo-sc-1mjgwl-0.dzAsG > div:nth-child(2) > div > span > a'
              );

              let titleText = title;
              if (priceEl) {
                let text = priceEl.textContent;
                text = webLib.cleanDecodeString(text);
                titleText += 'Price: ' + text;
              }
              if (publishedEL) {
                let text = publishedEL.textContent;
                text = webLib
                  .cleanDecodeString(text)
                  .substring('Inlagd: '.length);
                titleText += '. Published: ' + text;
              }
              if (areaEl) {
                let text = areaEl.textContent;
                text = webLib.cleanDecodeString(text);
                text = text.replace('(', '');
                text = text.replace(')', '');
                text = text.substring(0, text.lastIndexOf(' '));
                titleText += '. Location: ' + text;
              }

              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_webhallen_com:
            (() => {
              let titleText = '';
              if (!webLib.REGEXP.WEBHALLEN.test(message)) {
                clientService.say(titleText, channel);
                return;
              }

              const match = webLib.REGEXP.WEBHALLEN.exec(message);
              const productId = match[1];
              if (productId === undefined) {
                clientService.say(titleText, channel);
                return;
              }

              const url = `https://www.webhallen.com/api/product/${productId}`;
              webLib
                .downloadPage(url)
                .then((data: string) => {
                  const obj = JSON.parse(data);
                  const name = obj.product.name;
                  let price = obj.product.price.price;
                  let regularPrice = obj.product.regularPrice.price;
                  price = parseInt(price);
                  regularPrice = parseInt(regularPrice);

                  if (!isNaN(regularPrice) && regularPrice > price) {
                    let percent = 1 - price / regularPrice;
                    percent = percent * 100;
                    percent = Math.floor(percent);
                    if (!isSmallMessage) {
                      titleText = `Title: ${name}. Price: ${formatNumber(
                        price
                      )} kr (${percent}'% Off!)`;
                    } else {
                      titleText = `Price: ${formatNumber(
                        price
                      )} kr (${percent}'% Off!)`;
                    }

                    clientService.say(titleText, channel);
                    return;
                  }

                  if (!isSmallMessage) {
                    titleText = `Title: ${name}. Price: ${formatNumber(
                      price
                    )} kr`;
                  } else {
                    titleText = `Price: ${formatNumber(price)} kr`;
                  }
                  clientService.say(titleText, channel);
                })
                .catch((e) => {});
            })();
            break;

          case SUPPORTED_DOMAINS.www_inet_se:
            (() => {
              let titleText = title;
              const priceEl = document.querySelector('.price');
              if (priceEl) {
                let text = priceEl.textContent;
                text = text.substring(0, text.indexOf('r') + 1);
                titleText += 'Price: ' + text;
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.cdon_se:
            (() => {
              let titleText = title;

              const activePriceEl = document.querySelector(
                '#price-button-container > span'
              );
              let activePriceStr = activePriceEl.textContent;
              activePriceStr = activePriceStr.trim();

              const regularPriceEl = document.querySelector(
                '#price-wrapper > div.default-price > span'
              );
              if (regularPriceEl) {
                let regularPriceStr = regularPriceEl.textContent;
                regularPriceStr = regularPriceStr.trim();

                const priceActive = parseInt(activePriceStr);
                const priceRegular = parseInt(regularPriceStr);

                let percent = 1 - priceActive / priceRegular;
                percent = percent * 100;
                percent = Math.floor(percent);
                titleText +=
                  'Price: ' + activePriceStr + ' (' + percent + '% off!)';
              } else {
                titleText += 'Price: ' + activePriceStr;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_clasohlson_com:
            (() => {
              let titleText = title;
              const priceEl = document.querySelector(
                'body > main > div.main__inner-wrapper > div.yCmsContentSlot.product-detail-section > div > section.product__details.clearfix > div > div.col-lg-4.col-sm-12.col-md-6.product__price-section > div.product__price > div.product__normal-price > span.product__price-value'
              );
              if (priceEl) {
                let text = priceEl.textContent;
                text = webLib.cleanDecodeString(text);
                text = text.trim();
                titleText += 'Price: ' + text + ' kr';
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_biltema_se:
            (() => {
              let titleText = title;
              const priceEl = document.querySelector(
                '#productpage > article > div:nth-child(2) > div.price.price--big > div > span:nth-child(1)'
              );
              if (priceEl) {
                let text = priceEl.textContent;
                titleText += 'Price: ' + text + ' kr';
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_komplett_se:
            (() => {
              let titleText = title;
              const priceEl = document.querySelector('.product-price-now');
              if (priceEl) {
                let text = priceEl.textContent;
                text = text.replace(':', '');
                text = text.replace('-', '');
                titleText += 'Price: ' + text + ' kr';
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_ikea_com:
            (() => {
              let titleText = title;

              const activePriceEl = document.querySelector(
                '#content > div.product-pip.js-product-pip > div.product-pip__top-container.flex.center-horizontal > div.product-pip__right-container > div.product-pip__price-package > div > p.js-pip-price-component.no-margin > span > span > span'
              );
              let activePriceStr = activePriceEl.textContent;
              activePriceStr = activePriceStr.trim();

              const regularPriceEl = document.querySelector(
                '#content > div.product-pip.js-product-pip > div.product-pip__top-container.flex.center-horizontal > div.product-pip__right-container > div.product-pip__price-package > div > p.product-pip__previous-price > span > span.product-pip__product-price.bold'
              );
              if (regularPriceEl) {
                let regularPriceStr = regularPriceEl.textContent;
                regularPriceStr = regularPriceStr.trim();

                const priceActive = parseInt(activePriceStr);
                const priceRegular = parseInt(regularPriceStr);

                let percent = 1 - priceActive / priceRegular;
                percent = percent * 100;
                percent = Math.floor(percent);
                titleText +=
                  'Price: ' + activePriceStr + ' (' + percent + '% off!)';
              } else {
                titleText += 'Price: ' + activePriceStr;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_twostroke_se:
            (() => {
              let titleText = title;
              const priceEl = document.querySelector('#updPrice');
              if (priceEl) {
                let text = priceEl.textContent;
                titleText += 'Price: ' + text;
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_jula_se:
            (() => {
              let titleText = title;
              const priceEl = document.querySelector('.c-price__text');
              if (priceEl) {
                let text = priceEl.textContent;
                text = webLib.cleanDecodeString(text);
                text = text.substring(0, text.lastIndexOf(','));
                titleText += 'Price: ' + text + ' kr';
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;
        }
      })
      .catch((e) => {});
  }
}

export default PriceTitle;
