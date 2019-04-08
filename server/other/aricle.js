import { stringify } from 'query-string';
import moment from 'moment';
import fetch from 'node-fetch';
import { API_KEY } from '@/config/idataapi';

export function format(data) {
  return {
    ...data,
    description: data.content,
    source: data.appName,
    date: data.publishDate,
    labels: [data.catLabel1, data.catLabel2],
    photos: data.imageUrls,
    cover: Array.isArray(data.imageUrls) ? data.imageUrls[0] : '',
    tags: data.topkeyword,
  };
}

export function filter(data) {
  // 排除没有正文的
  if (!data.html) return false;
  // 排除国外源
  // if (data.sourceRegion !== '中国') return false;
  // 排除无图的
  if (!Array.isArray(data.imageUrls) || !data.imageUrls[0]) return false;
  return true;
}

export async function getList({ keyword: kw, options }) {
  const params = { apikey: API_KEY, sourceRegion: '中国', kw, ...options };
  const str = stringify(params);
  const api = `http://api01.idataapi.cn:8000/article/idataapi?${str}`;
  console.log('抓取综合文章：', api);
  const data = await fetch(api, { method: 'GET' }).then(res => res.json());
  if (data.data) {
    const result = data.data
      .filter(i => filter(i))
      .map(i => format(i));

    // console.log('result');
    // console.log(result);

    return result;
  }
  throw data;
}

export async function getDetail(options) {
  const params = {
    apikey: API_KEY,
    ...options,
  };
  const str = stringify(params);
  const api = `http://api01.idataapi.cn:8000/article/idataapi?${str}`;
  const data = await fetch(api, { method: 'GET' }).then(res => res.json());
  if (data.data[0]) {
    return format(data.data[0]);
  }
  throw data;
}

async function test() {
  try {
    // const data = await getCategory();
  // const data = await getList();
    const data = await getList('switch');
    // const data = await getDetail({ id: 'a55bfba3edca4d6a3b83db59d884bebb' });
    console.log('data');
    console.log(data);
  } catch (error) {
    console.log('error');
    console.log(error);
  }
}

// test();