const nf = Intl.NumberFormat('sv-SE');
export const formatNumber = (num: number | string) => {
  if (typeof num === 'string') {
    num = parseInt(num);
  }
  return nf.format(num);
};
