import * as webService from "./Services/WebService";
import { formatNumber } from "./Plugins/Plugin/WebTitle/Children/PriceFormatter";

const url = `https://www.ikea.com/se/sv/p/faergrik-servis-18-delar-ljusgroen-40318921/`;
webService.downloadPageDom(url).then(dom => {
  if (!dom) {
    return;
  }
  const document = dom.window.document;
  const text = document.querySelector('#content > div.product-pip.js-product-pip > div.product-pip__top-container.flex.center-horizontal > div.product-pip__right-container > div.product-pip__price-package > div > p.js-pip-price-component.no-margin > span > span > span').textContent;
  const a = 'a';
});
