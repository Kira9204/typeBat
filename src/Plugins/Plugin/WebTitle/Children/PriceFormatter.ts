import { LOCALE } from "./Constants";

const nf = Intl.NumberFormat(LOCALE);
export const formatNumber = (num: number | string) => {
  if (typeof num === 'string') {
    num = parseInt(num);
  }
  return nf.format(num);
};
