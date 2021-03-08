import * as webLib from '../../../../Libs/WebLib';
import { IClientService } from '../../../../Types/ClientMessage';
import { IPluginChildInterface } from '../../../../Types/PluginInterface';
import { cleanPriceStrToInt, formatNumber, formatDurationFromSecs, percentStr } from './utils';
import { cleanDecodeString } from '../../../../Libs/WebLib';

const SUPPORTED_DOMAINS: { [key: string]: string } = {
  m_blocket_se: 'm.blocket.se',
  www_blocket_se: 'www.blocket.se',
  www_webhallen_com: 'www.webhallen.com',
  www_inet_se: 'www.inet.se',
  cdon_se: 'cdon.se',
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
              const jsonEl = document.querySelector('#init-data');
              if(!jsonEl) {
                clientService.say(title, channel);
                return;
              }
              const json = jsonEl.getAttribute('data-init-data');
              if(!json) {
                clientService.say(title, channel);
                return;
              }

              const jsonObj = JSON.parse(json);
              const item = jsonObj.item;
              const itemDetails = item.itemDetails;

              let titleText = title;
              if(itemDetails.isAuction) {
                const bidAmount = formatNumber(item.bidInfo.leadingBidAmount);
                titleText += '. Leading bid: ' + bidAmount + ' kr';
              }
              if(itemDetails.isAuctionBin) {
                const bidAmount = formatNumber(item.bidInfo.nextValidBidAmount);
                titleText += '. First valid bid (none yet): ' + bidAmount + ' kr';
              }
              if(itemDetails.isBuyItNow) {
                const price = formatNumber(itemDetails.fixedPrice);
                titleText += '. Buy it now for: ' + price + ' kr';
              }
              if(item.serverSecondsLeft) {
                const time = item.serverSecondsLeft;
                if(time > 0) {
                  const duration = formatDurationFromSecs(time);
                  titleText += '. Ending in: ' + duration;
                } else {
                  titleText += '. Has already ended. ';
                }
              }
              clientService.say(titleText, channel);
            })();
            break;

          case SUPPORTED_DOMAINS.m_blocket_se:
          case SUPPORTED_DOMAINS.www_blocket_se:
            (() => {
              if (!webLib.REGEXP.BLOCKET.test(message)) {
                clientService.say(title, channel);
                return;
              }
              const match = webLib.REGEXP.BLOCKET.exec(message);
              const id = match[1];

              const jsonEl = document.querySelector("#__NEXT_DATA__");
              if(!jsonEl) {
                clientService.say(title, channel);
                return;
              }

              const jsonObj = JSON.parse(jsonEl.textContent);
              const authBearer = 'Bearer '+jsonObj.props.initialReduxState.authentication.bearerToken;
              const url = `https://api.blocket.se/search_bff/v1/content/${id}?include=safety_tips&include=store&include=partner_placements&include=breadcrumbs&include=archived&status=active&status=deleted&status=hidden_by_user`;
              webLib
                .downloadPage(url, {"Authorization": authBearer})
                .then((response: string) => {
                  const obj = JSON.parse(response);
                  const data = obj.data;

                  const title = data.subject;
                  const priceRaw = data.price.value;
                  const listTimeRaw = data.list_time;
                  const date = listTimeRaw.substring(0, listTimeRaw.indexOf('T'));
                  const time = listTimeRaw.substring(listTimeRaw.indexOf('T')+1, listTimeRaw.indexOf('+'));
                  const location = data.location[data.location.length-1].name

                  const titleText = `Title: ${title}. Price: ${formatNumber(priceRaw)} kr. Time: ${date} ${time}. Location: ${location}`
                  clientService.say(titleText, channel);
                });
            })();
            break;

          case SUPPORTED_DOMAINS.www_webhallen_com:
            (() => {
              if (!webLib.REGEXP.WEBHALLEN.test(message)) {
                clientService.say(title, channel);
                return;
              }

              const match = webLib.REGEXP.WEBHALLEN.exec(message);
              const productId = match[1];
              if (productId === undefined) {
                clientService.say(title, channel);
                return;
              }

              let titleText = '';
              const url = `https://www.webhallen.com/api/product/${productId}`;
              webLib
                .downloadPage(url)
                .then((data: string) => {
                  const obj = JSON.parse(data);
                  const name = obj.product.name;
                  const price = parseInt(obj.product.price.price);
                  const regularPrice = parseInt(obj.product.regularPrice.price);
                  if (!isNaN(regularPrice) && regularPrice > price) {
                    titleText = `Title: ${name}. Price: ${formatNumber(price)} kr (${percentStr(price, regularPrice)} % Off!)`;
                    clientService.say(titleText, channel);
                    return;
                  }
                  titleText = `Title: ${name}. Price: ${formatNumber(price)} kr`;
                  clientService.say(titleText, channel);
                })
                .catch((e) => {});
            })();
            break;

          case SUPPORTED_DOMAINS.www_inet_se:
            (() => {
              const productEl = document.querySelector("#react-root > div:nth-child(3) > div > div.main-column > div.main-content > article > section.box.box-body.product-description > header > h1");
              if(!productEl) {
                clientService.say(title, channel);
                return;
              }

              const campaignPriceEl = document.querySelector("#react-root > div:nth-child(3) > div > div.main-column > div.main-content > article > div > section.box.product-purchase > div > span > span.campaign-price");
              const listPriceEl = document.querySelector("#react-root > div:nth-child(3) > div > div.main-column > div.main-content > article > div > section.box.product-purchase > div > span > span.list-price");
              const priceEl = document.querySelector("#react-root > div:nth-child(3) > div > div.main-column > div.main-content > article > div > section.box.product-purchase > div > span");

              // There is a price cut on this product!
              if(campaignPriceEl) {
                const campaignPrice = cleanPriceStrToInt(campaignPriceEl.textContent);
                let listPrice = cleanPriceStrToInt(listPriceEl.textContent);
                const title = `Title: ${productEl.textContent}. Price: ${formatNumber(campaignPrice)} kr (${percentStr(listPrice, campaignPrice)}% Off!)`;
                clientService.say(title, channel);
              } else if (priceEl) {
                const price = cleanPriceStrToInt(priceEl.textContent);
                const title = `Title: ${productEl.textContent}. Price: ${formatNumber(price)} kr`;
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.cdon_se:
            (() => {
              const titleEl = document.querySelector("#product-header__title-wrapper > div > h1");
              if(!titleEl) {
                clientService.say(title, channel);
                return;
              }

              const activePriceEl = document.querySelector(
                '#buy-area__price-wrapper > div.buy-area__current-price'
              );
              const activePrice = cleanPriceStrToInt(activePriceEl.textContent);

              const regularPriceEl = document.querySelector(
                '#buy-area__price-wrapper > div.buy-area__ordinary-price > span.buy-area__original-price-withVat-consumer'
              );


              if (regularPriceEl) {
                const regularPrice = cleanPriceStrToInt(regularPriceEl.textContent);
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(activePrice)} (${percentStr(activePrice, regularPrice)}% off!)`;
                clientService.say(title, channel);
              } else {
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(activePrice)}`
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.www_clasohlson_com:
            (() => {
              const titleEl = document.querySelector("body > main > div.main__inner-wrapper.js-main-inner-wrapper > div.yCmsContentSlot.product-detail-section > div:nth-child(2) > section.product__title > h1");
              if(!titleEl) {
                clientService.say(title, channel);
                return;
              }

              const oldPriceEl = document.querySelector('.product__old-price');
              const priceEl = document.querySelector('.product__price-value');
              if (oldPriceEl) {
                const priceRegular = cleanPriceStrToInt(oldPriceEl.textContent);
                const currentPriceEl = document.querySelector('.product__discount-price');
                if (!currentPriceEl) {
                  clientService.say(title, channel);
                  return;
                }
                const priceActive = cleanPriceStrToInt(currentPriceEl.textContent);
                const titleSay = `Title: ${cleanDecodeString(titleEl.textContent)}. Price: ${formatNumber(priceActive)} kr (${percentStr(priceActive, priceRegular)}% off!)`;
                clientService.say(titleSay, channel);
              } else if (priceEl) {
                const price = cleanPriceStrToInt(priceEl.textContent);
                const title = `Title: ${cleanDecodeString(titleEl.textContent)}. Price: ${formatNumber(price)} kr`;
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.www_kjell_com:
            (() => {
              const titleEl = document.querySelector("#content-container > div.z.a0.dr.o.a.dm.fb > section.z.a0.a1.a2.fd.fe.ff.fg > div.b.c.n > h1");
              if(!titleEl) {
                clientService.say(title, channel);
                return;
              }

              const priceCampaignEl = document.querySelector('#content-container > div.z.a0.dr.o.a.dm.fb > section.z.a0.a1.a2.fd.fe.ff.fg > div.e > div.e.g8.g9.z.a0 > div.w.gk.k.b.c.gl.gm.gn.go.dr > span > span.gf.cw.gw.gy.gz.fh');
              const priceOriginalEl = document.querySelector('#content-container > div.z.a0.dr.o.a.dm.fb > section.z.a0.a1.a2.fd.fe.ff.fg > div.e > div.e.g8.g9.z.a0 > div.w.gk.k.b.c.gl.gm.gn.go.dr > span > span.gf.h3.h4.cw.g4.fn.h5');
              const priceEl = document.querySelector('#content-container > div.z.a0.dr.o.a.dm.fb > section.z.a0.a1.a2.fd.fe.ff.fg > div.e > div.e.g8.g9.z.a0 > div.w.gk.k.b.c.gl.gm.gn.go.dr > span > span');

              // This item has a price reduction!
              if(priceCampaignEl) {
                const priceCampaign = cleanPriceStrToInt(priceCampaignEl.textContent);
                const priceOriginal = cleanPriceStrToInt(priceOriginalEl.textContent);
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(priceCampaign)} (${percentStr(priceOriginal, priceCampaign)}% off!)`;
                clientService.say(title, channel);
                return;
              } else if(priceEl) {
                const price = cleanPriceStrToInt(priceEl.textContent);
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(price)}`;
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.www_biltema_se:
            (() => {
              const scriptEl = document.querySelector("body > script:nth-child(20)");
              if(!scriptEl) {
                clientService.say(title, channel);
                return;
              }

              try {
                const allText = scriptEl.textContent;
                let productDataJson = allText.substring(allText.indexOf('window.productData')+43);
                productDataJson = productDataJson.substring(0, productDataJson.lastIndexOf(';'));
                const productDataObj = JSON.parse(productDataJson);

                const name = productDataObj.singleArticle.name;
                const price = productDataObj.singleArticle.priceIncVAT;
                const toSay = `Title: ${name}. Price: ${price} kr`;
                clientService.say(toSay, channel);
              } catch (e) {}

            })();
            break;

          case SUPPORTED_DOMAINS.www_komplett_se:
            (() => {
              const titleEl = document.querySelector("#MainContent > div.no-bs-center.maincontent-container.container.main-body.ignore-gutter-xs.product-page-boxes > div.responsive-content-wrapper > div.product-page > section > div > section > div.product-main-info__info > h1 > span");;
              if(!titleEl) {
                clientService.say(title, channel);
                return;
              }
              const oldPriceEl = document.querySelector('#MainContent > div.no-bs-center.maincontent-container.container.main-body.ignore-gutter-xs.product-page-boxes > div.responsive-content-wrapper > div.product-page > section > div > section > div.product-main-info__body > div.product-main-info__buy-and-more > div.buy-button-section > div > div > div.price-freight-financing > div.price-freight > div.product-price-before');
              const newPriceEl = document.querySelector('#MainContent > div.no-bs-center.maincontent-container.container.main-body.ignore-gutter-xs.product-page-boxes > div.responsive-content-wrapper > div.product-page > section > div > section > div.product-main-info__body > div.product-main-info__buy-and-more > div.buy-button-section > div > div > div.price-freight-financing > div.price-freight > div.product-price > span');

              if (oldPriceEl) {
                const oldPrice = cleanPriceStrToInt(oldPriceEl.textContent);
                const newPrice = cleanPriceStrToInt(newPriceEl.textContent);
                const percent = percentStr(oldPrice, newPrice);
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(newPrice)} kr (${percent}% off!)`;
                clientService.say(title, channel);
              } else if (newPriceEl) {
                const newPrice = cleanPriceStrToInt(newPriceEl.textContent);
                const title = `Tile: ${titleEl.textContent}. Price: ${formatNumber(newPrice)} kr`;
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.www_ikea_com:
            (() => {
              const titleEl = document.querySelector("#content > div > div > div > div.range-revamp-product__subgrid.product-pip.js-product-pip > div.range-revamp-product__buy-module-container.range-revamp-product__grid-gap > div > div.js-price-package.range-revamp-pip-price-package > div.range-revamp-pip-price-package__wrapper > div.range-revamp-pip-price-package__content-left > h1 > div.range-revamp-header-section__title--big.notranslate");
              if(!titleEl) {
                clientService.say(title, channel);
                return;
              }
              const activePriceEl = document.querySelector(
                '#content > div > div > div > div.range-revamp-product__subgrid.product-pip.js-product-pip > div.range-revamp-product__buy-module-container.range-revamp-product__grid-gap > div > div.js-price-package.range-revamp-pip-price-package > div.range-revamp-pip-price-package__wrapper > div.range-revamp-pip-price-package__price-wrapper > div.range-revamp-pip-price-package__main-price > span > span.range-revamp-price__integer'
              );
              const priceActive = cleanPriceStrToInt(activePriceEl.textContent);
              const regularPriceEl = document.querySelector(
                '#content > div > div > div > div.range-revamp-product__subgrid.product-pip.js-product-pip > div.range-revamp-product__buy-module-container.range-revamp-product__grid-gap > div > div.js-price-package.range-revamp-pip-price-package > div.range-revamp-pip-price-package__wrapper > div.range-revamp-pip-price-package__price-wrapper > div.range-revamp-pip-price-package__previous-price-hasStrikeThrough > span > span.range-revamp-price__integer'
              );
              if (regularPriceEl) {
                const priceRegular = cleanPriceStrToInt(regularPriceEl.textContent);
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(priceActive)} (${percentStr(priceActive, priceRegular)}% off!)`;
                clientService.say(title, channel);
              } else {
                const title = `Title: ${titleEl.textContent}. Price: ${formatNumber(priceActive)}`;
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.www_twostroke_se:
            (() => {
              const titleEl = document.querySelector("#h1Header");
              if(!titleEl) {
                clientService.say(title, channel);
                return;
              }

              const priceEl = document.querySelector('#updPrice');
              if (priceEl) {
                const price = cleanPriceStrToInt(priceEl.textContent);
                const title = `Title: ${cleanDecodeString(titleEl.textContent)}. Price: ${formatNumber(price)} kr`;
                clientService.say(title, channel);
              }
            })();
            break;

          case SUPPORTED_DOMAINS.www_jula_se:
            (() => {
              const scriptEl = document.querySelector("head > script:nth-child(54)");
              if(!scriptEl) {
                clientService.say(title, channel);
                return;
              }

              try {
                let jsonText = scriptEl.innerHTML;
                jsonText = jsonText.substring(jsonText.indexOf('{'));
                const jsonObj = JSON.parse(jsonText);

                const name = jsonObj.name;
                const price = jsonObj.offers.price;

                const toSay = `Title: ${name}. Price: ${formatNumber(price)} kr`;
                clientService.say(toSay, channel);
              } catch (e) {}
            })();
            break;
        }
      })
      .catch((e) => {});
  }
}

export default PriceTitle;
