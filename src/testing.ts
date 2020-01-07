import * as webService from './Services/WebService';
const url = `https://open.spotify.com/track/4awNA1VMeEbU0fwKCxyS2a?si=gzi-PfJUTkiiedKtUBRyWQ`;
webService.downloadPageDom(url).then((dom) => {
  if (!dom) {
    return;
  }
  const document = dom.window.document;
  const text = document.querySelector(
    '#content > div.product-pip.js-product-pip > div.product-pip__top-container.flex.center-horizontal > div.product-pip__right-container > div.product-pip__price-package > div > p.js-pip-price-component.no-margin > span > span > span'
  ).textContent;
  const a = 'a';
});
