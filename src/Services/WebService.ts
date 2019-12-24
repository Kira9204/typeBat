import rp from 'request-promise-native';
import htmlEntities from 'html-entities';
import URLLib from 'url';
import JSDOMLib from 'jsdom';

const TIMEOUT = 10000;
const USERAGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36';

export const REGEXP = {
  YOUTUBE: /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)((?:\/watch\?v=|\/)([^\s&]+))/,
  SOUNDCLOUD: /^https?:\/\/soundcloud\.com\/\S+\/\S+$/i,
  TWITCH: /https:\/\/www\.twitch\.tv\/(\w+)/,
  VIMEO: /https:\/\/vimeo\.com\/(\d+)/,
  SPOTIFY: /https:\/\/open\.spotify\.com/,
  STEAM: /https:\/\/store\.steampowered\.com\/app\/(\d+)/,
  SVT: /https:\/\/www\.svtplay\.se\/video\/(\d+)/,
  WEBHALLEN: /https:\/\/www\.webhallen\.com\/se\/product\/(\d+)/
};

/**
 * Replaces all line breaks and tabs, and decodes escaped utf-8 characters back to utf-8.
 * @param str
 */
export const cleanDecodeString = (str: string) => {
  if (!str) {
    return null;
  }
  str = str.trim();
  str = str.replace(/\r?\n|\r|\t/g, '');

  const entities = new htmlEntities.AllHtmlEntities();
  str = entities.decode(str);

  return str;
};

/**
 * Parses a URL using Mozillas URL parser. If successful an object with all parts of the
 * URL will be returned. If not null will be returned.
 * @param url
 * @returns boolean
 */
export const parseUrl = (url: string) => {
  try {
    return new URLLib.URL(url);
  } catch (e) {
    return null;
  }
};


/**
 * Returns a promise with a HTTP HEAD request. Useful if you need metadata about a provided resource,
 * such as if it's a textual document or a binary such as an image.
 * Automatically adds GZIP/cookies support
 * @param myUrl
 * @param userAgent
 */
export const getHeaders = (myUrl: string, userAgent: string = USERAGENT) => {
  return rp({
    method: 'HEAD',
    resolveWithFullResponse: true,
    gzip: true,
    headers: {
      'User-Agent': userAgent,
      Accept: '*/*',
      'Accept-Encoding': 'gzip'
    },
    jar: rp.jar(),
    timeout: TIMEOUT,
    url: myUrl
  });
};

/**
 * Returns a promise with a HTTP GET request. Automatically adds GZIP/cookies support
 * @param myUrl The URL to download the document from
 * @param [userAgent] If you need another user-agent for your request
 */
export const downloadPage = (
  myUrl: string,
  userAgent: string = USERAGENT
) => {
  return rp({
    gzip: true,
    headers: {
      'User-Agent': userAgent,
      Accept: '*/*',
      'Accept-Encoding': 'gzip'
    },
    jar: rp.jar(),
    timeout: TIMEOUT,
    url: myUrl
  });
};

/**
 * Downloads a page and returns a promise containing the parsed JSDOM document
 * @param myUrl The URL to download the document from
 * @param [userAgent] If you need another user-agent for your request
 */
export const downloadPageDom = (
  myUrl: string,
  userAgent: string = USERAGENT
) => {
  return downloadPage(myUrl, userAgent).then((html) => {
    return new JSDOMLib.JSDOM(html);
  }).catch(e => {});
};

/**
 * Downloads the web document at the given address and returns a clean decoded page title
 * @param myUrl
 * @param userAgent
 */
export const downloadPageTitle = (
  myUrl: string,
  userAgent: string = USERAGENT
) => {
  return downloadPageDom(myUrl).then((dom) => {
    if (!dom) {
      return null;
    }
    const tdom = dom.window.document.querySelector('title');
    if (!dom || !tdom) {
      return null;
    }
    let title = tdom.innerHTML;
    title = cleanDecodeString(title);
    return title;
  }).catch(e => {});
};

/**
 * Performs a POST request and returns a promise with the request result.
 * Post data can be either in JSON or form-data format.
 * @param myUrl The URL to send the HTTP POST request to
 * @param data The data object to send
 * @param [postAsFormData] If you want to send form data, set to true, otherwise JSON will be assumed.
 */
export const post = (myUrl: string, data: object, postAsFormData = false) => {
  const options: rp.Options = {
    method: 'POST',
    url: myUrl,
  };
  if (!postAsFormData) {
    options.body = data;
    options.json = true;
  } else {
    options.form = data;
  }

  return rp(options);
};
