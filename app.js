import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import KoaStatic from 'koa-static';
import cors from 'koa2-cors';
import helmet from 'koa-helmet';
import { PORT } from '@/config/base';
import jwt from '@/utils/jwt';
import graphql from '@/graphql';
import router from './router';
import '@/utils/mongoose';
import '@/utils/redis';
// import '@/server/email/exqq';
// import '@/server/recognition/tencent';
// import '@/server/crawler/jojo';
// import '@/server/crawler/other/excel';
// import '@/server/crawler/other/csv';
// import '@/server/crawler/other/parcels';
import '@/server/news';

const app = new Koa();

app.use(
  cors({
    credentials: true, // 允许携带cookie
  }),
);
app.use(helmet());
app.use(BodyParser({ enableTypes: ['json', 'form', 'text'] }));
app.use(KoaStatic(`${__dirname}/public`));
app.use(jwt);
app.use(router.routes());

graphql.applyMiddleware({ app });

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(
    `🎉 Graphql ready at http://localhost:${PORT}${graphql.graphqlPath}`,
  );
});
