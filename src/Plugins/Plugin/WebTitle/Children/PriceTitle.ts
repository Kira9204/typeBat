import * as webLib from '../../../../Libs/WebLib';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { formatNumber } from './PriceFormatter';

const SUPPORTED_DOMAINS: { [key: string]: string } = {
  m_blocket_se: 'm.blocket.se',
  www_blocket_se: 'www.blocket.se',
  www_webhallen_com: 'www.webhallen.com',
  www_inet_se: 'www.inet.se',
  cdon_se: 'b2c.cdon.se',
  www_tradera_com: 'www.tradera.com',
  www_clasohlson_com: 'www.clasohlson.com',
  www_kjell_com: 'www.kjell.com',
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

const cleanStrToInt = (str: string) => {
  const clean = str.replace(/[^0-9]/g, '');
  return parseInt(clean);
}

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
                '#view-item-main > div.view-item-details.view-item-details-bids > article > section > section > div > h2'
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
                titleText += '. Leading bid: ' + text + ' kr';
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
                'div.TextHeadline1__TextHeadline1Wrapper-sc-18mtyla-0'
              );
              const publishedEL = document.querySelector(
                '.PublishedTime__StyledTime-pjprkp-1'
              );
              const areaEl = document.querySelector(
                '.LocationInfo__StyledMapLink-sc-1op511s-3'
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
                      )} kr (${percent} % Off!)`;
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
                '#buy-area__price-wrapper > div.buy-area__current-price'
              );
              let activePriceStr = activePriceEl.textContent;
              activePriceStr = activePriceStr.trim();

              const regularPriceEl = document.querySelector(
                '#buy-area__price-wrapper > div.buy-area__ordinary-price > span.buy-area__original-price-withVat-consumer'
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

              const oldPriceEl = document.querySelector('.product__old-price');
              if (oldPriceEl) {
                let oldPriceText = oldPriceEl.textContent;
                oldPriceText = oldPriceText.replace(/\s/g, '');
                oldPriceText = oldPriceText.substring(0, oldPriceText.indexOf(','));
                const priceRegular = parseInt(oldPriceText);

                const currentPriceEl = document.querySelector('.product__discount-price');
                if (!currentPriceEl) {
                  return;
                }

                let currentPriceText = currentPriceEl.textContent;
                currentPriceText = currentPriceText.replace(/\s/g, '');
                currentPriceText = currentPriceText.substring(0, currentPriceText.indexOf(','));
                const priceActive = parseInt(currentPriceText);

                let percent = 1 - priceActive / priceRegular;
                percent = percent * 100;
                percent = Math.floor(percent);
                titleText += 'Price: ' + currentPriceText + ' kr (' + percent + '% off!)';
                clientService.say(titleText, channel);
                return;
              }
              const priceEl = document.querySelector('.product__price-value');
              if (priceEl) {
                let currentPriceText = priceEl.textContent;
                currentPriceText = currentPriceText.replace(/\s/g, '');
                currentPriceText = currentPriceText.substring(0, currentPriceText.indexOf(','));

                titleText += 'Price: ' + currentPriceText+' kr';
                clientService.say(titleText, channel);
                return;
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.www_kjell_com:
            (() => {
              let titleText = title;

              const metaTag = document.querySelector("meta[property='product:price:amount']");
              if (metaTag) {
                const priceMetaContent = metaTag.getAttribute("content");
                const priceFormatted = formatNumber(priceMetaContent);
                titleText += 'Price: ' + priceFormatted+' kr';
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

              let oldPriceEl = document.querySelector('#MainContent > div > div.responsive-content-wrapper > div:nth-child(2) > div.product-page > section > div > section > div.product-main-info__body > div.product-main-info__buy-and-more > div.buy-button-section > div > div > div.price-freight-financing > div.price-freight > div.product-price-before');
              let newPriceEl = document.querySelector('#MainContent > div > div.responsive-content-wrapper > div:nth-child(2) > div.product-page > section > div > section > div.product-main-info__body > div.product-main-info__buy-and-more > div.buy-button-section > div > div > div.price-freight-financing > div.price-freight > div.product-price > span');

              const cleanPriceEl = (priceEl: any) => {
                const text = priceEl.textContent;
                return cleanStrToInt(text);
              }

              if (oldPriceEl) {
                const oldPrice = cleanPriceEl(oldPriceEl);
                const newPrice = cleanPriceEl(newPriceEl);

                let percent = 1 - oldPrice / newPrice;
                percent = percent * 100;
                percent = Math.floor(percent);
                titleText += 'Price: ' + newPrice + ' kr (' + percent + '% off!)';
                clientService.say(titleText, channel);
                return;
              } else if (newPriceEl) {
                const newPrice = cleanPriceEl(newPriceEl);
                titleText += 'Price: ' + newPrice + ' kr';
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
                '#content > div > div > div > div.range-revamp-product__subgrid.product-pip.js-product-pip > div.range-revamp-product__buy-module-container.range-revamp-product__grid-gap > div > div.js-price-package.range-revamp-pip-price-package > div.range-revamp-pip-price-package__wrapper > div.range-revamp-pip-price-package__price-wrapper > div.range-revamp-pip-price-package__main-price > span > span.range-revamp-price__integer'
              );
              let activePriceStr = activePriceEl.textContent;
              activePriceStr = activePriceStr.trim();

              const regularPriceEl = document.querySelector(
                '#content > div > div > div > div.range-revamp-product__subgrid.product-pip.js-product-pip > div.range-revamp-product__buy-module-container.range-revamp-product__grid-gap > div > div.js-price-package.range-revamp-pip-price-package > div.range-revamp-pip-price-package__wrapper > div.range-revamp-pip-price-package__price-wrapper > div.range-revamp-pip-price-package__previous-price-hasStrikeThrough > span > span.range-revamp-price__integer'
              );
              if (regularPriceEl) {
                const priceActive = cleanStrToInt(activePriceEl.textContent);
                const priceRegular = cleanStrToInt(regularPriceEl.textContent);

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
