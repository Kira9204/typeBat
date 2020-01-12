import * as webService from './WebService';
// @ts-ignore
import { API_KEYS } from '../../apikeys';
import { cleanDecodeString } from './WebService';
const API_KEY_YOUTUBE = API_KEYS.YOUTUBE;

export interface ISuggestedVideo {
  title: string;
  videoId: string;
}

export const findYoutubeVideos = (
  searchQuery: string,
  maxResults: number = 5,
  callback?: (videoSuggestions: ISuggestedVideo[]) => void
) => {
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&maxResults=${maxResults}&q=${searchQuery.replace(
    ' ',
    '%20'
  )}&key=${API_KEY_YOUTUBE}`;
  webService.downloadPage(apiUrl).then((data: string) => {
    const responseObj = JSON.parse(data);
    const suggestedVideos: ISuggestedVideo[] = [];
    responseObj.items.forEach((e: any) => {
      if (e.id.kind === 'youtube#video') {
        suggestedVideos.push({
          title: cleanDecodeString(e.snippet.title),
          videoId: e.id.videoId
        });
      }
    });
    callback(suggestedVideos);
  });
};
