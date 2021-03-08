const nf = Intl.NumberFormat('sv-SE');
export const cleanPriceStrToInt = (str: string) => {
  if(str.length > 2) {
    if(str.includes('kr')) {
      str = str.substring(0, str.length-3);
    }

    if(str.includes('90')) {
      str = str.substring(0, str.length-2);
    } else if(str.includes('.00')) {
      str = str.substring(0, str.length-3);
    }
  }

  const clean = str.replace(/[^0-9]/g, '');
  return parseInt(clean);
}
export const formatNumber = (num: number | string) => {
  if (typeof num === 'string') {
    num = parseInt(num);
  }
  return nf.format(num);
};

export const formatDurationFromSecs = (time: number | string) => {
  if (typeof time === 'string') {
    time = parseInt(time);
  }
  if(time <= 0) {
    return "0s";
  }

  const hours = Math.round((time / 3600) % 24);
  const minutes = Math.round((time / 60) % 60);
  const seconds = Math.round(time % 60);

  let duration = '';
  if (hours > 0) {
    duration += '' + hours + 'h ';
  }
  if (minutes > 0) {
    duration += '' + minutes + 'm ';
  }
  if (seconds > 0) {
    duration += '' + seconds + 's';
  }

  return duration;
}

export const percentStr = (part: number | string, whole: number | string) => {
  if (typeof part === 'string') {
    part = parseInt(part);
  }
  if (typeof whole === 'string') {
    whole = parseInt(whole);
  }

  let percent = 1 - part / whole;
  percent = percent * 100;
  percent = Math.floor(percent);

  return percent;
}