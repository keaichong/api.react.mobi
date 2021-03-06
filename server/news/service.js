import { stringify } from 'query-string';
import fetch from 'node-fetch';
import uniqBy from 'lodash/uniqBy';
import reverse from 'lodash/reverse';
import { API_KEY } from '@/config/idataapi';
import News from '@/mongo/models/news';
import { format, filter, getNews } from './utils';
import { sleep } from '@/utils/common';

export async function getList({ keyword: kw = 'switch', ...options }) {
  const params = {
    kw,
    apikey: API_KEY,
    sourceRegion: '中国',
    ...options,
  };

  const str = stringify(params);
  const api = `http://api01.idataapi.cn:8000/article/idataapi?${str}`;
  console.log('抓取综合文章：', api);
  const data = await fetch(api, { method: 'GET' }).then(res => res.json());
  if (data.retcode === '000000') {
    return data;
  }
  throw data;
}

export async function getData(args) {
  try {
    const data = await getList(args);
    console.log(`本次查到 ${data.data.length} 条数据${data.pageToken}`);

    const result = uniqBy(reverse(data.data), 'title')
      // const result = data.data
      .filter(i => filter(i))
      .map(i => format(i));

    let hasNew = false;

    await Promise.all(
      result.map(async (i) => {
        const obj = await News.findOne({
          $or: [{ 'sourceData.id': i.id }, { 'sourceData.title': i.title }],
        });
        // const obj = await News.findOne({ 'sourceData.id': i.id });
        if (obj) {
          console.log('已存在：', i.title);
          return;
        }

        hasNew = true;
        try {
          const news = await getNews(i);
          await News.create(news);
          console.log('已写入：', i.title);
        } catch (error) {
          console.log(`写入失败：${i.title}`);
          console.log(error);
        }
      }),
    );

    if (data.hasNext && data.pageToken && hasNew) {
      await sleep(3000);
      console.log(`继续查询下一页：${data.pageToken}`);
      getData({ ...args, pageToken: data.pageToken });
    } else {
      console.log('全部数据抓取完成');
    }
  } catch (error) {
    if (error.retcode === '100002') {
      console.log('未找到到任何文章，查询结束');
      return;
    }
    console.log('error');
    console.log(error);
  }
}
