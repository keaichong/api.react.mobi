import notification from './models/notification/schema';
import dynamic from './models/dynamic/schema';
import user from './models/user/schema';
import article from './models/article/schema';
import wechat from './models/wechat/schema';
import meizitu from './models/meizitu/schema';
import mzitu from './models/mzitu/schema';
import bxgif from './models/bxgif/schema';
import doyogif from './models/doyogif/schema';
import other from './models/other/schema';
import qiniu from './models/qiniu/schema';
import comment from './models/comment/schema';
import like from './models/like/schema';
import news from './models/news/schema';
import follow from './models/follow/schema';

export default `
  scalar Date

  ${notification}
  ${dynamic}
  ${user}
  ${article}
  ${wechat}
  ${meizitu}
  ${mzitu}
  ${bxgif}
  ${doyogif}
  ${other}
  ${qiniu}
  ${comment}
  ${follow}
  ${like}
  ${news}

  type Result {
    status: Int!
    message: String
  }

  type ListQueryMeta {
    count: Int!
  }

  type Query {

    # 用户
    userInfo: User!
    userInfoById(_id: String): User!

    # 消息通知
    notification(_id: String): Notification
    notifications(first: Int, skip: Int, unread: Boolean, type: String): [Notification]
    _notificationsMeta: NotificationMeta!

    # 文章
    article(_id: String): Article!
    articles(first: Int, skip: Int): [Article]
    _articlesMeta: ArticleMeta!

    # 评论
    comments(first: Int, skip: Int, session: String!): [Comment]
    replys(first: Int, skip: Int, commentTo: String!): [Comment]
    _commentsMeta(session: String!): CommentsMeta!
    comment(_id: String): Comment!

    # 关注
    follows(first: Int, skip: Int, user: String!): [Follow]
    _followsMeta(user: String!): ListQueryMeta
    fans(first: Int, skip: Int, user: String!): [Follow]
    _fansMeta(user: String!): ListQueryMeta

    # 喜欢
    likes(first: Int, skip: Int, user: String, status: Int): [Like]
    _likesMeta(user: String, status: Int): LikesMeta!

    # 动态
    dynamic(_id: String): Dynamic
    dynamics(first: Int, skip: Int, topic: String, user: String): [Dynamic]
    DynamicTopics(first: Int, skip: Int, title: String): [DynamicTopic]
    DynamicTopic(topic: String): DynamicTopic
    _dynamicsMeta: DynamicMeta!

    # 微信公众号文章
    wechat(name: String): [Wechat!]
    wechatDetail(_id: String): WechatDetail

    # 妹子图
    meizituList(page: Int): [MeizituList]
    meizituPictures(_id: String): MeizituPictures

    # 福利图
    mzituList(skip: Int, search: String, tag: String, type: String): [Mzitu]
    mzituTags: [MzituTag!]
    mzituPictures(_id: String): MzituPictures

    # 爆笑gif
    bxgifList(skip: Int): [BxgifList!]
    bxgifDetail(_id: String): BxgifDetail

    # 逗游gif
    doyogifList(skip: Int): [DoyogifList!]
    doyogifDetail(_id: String, skip: Int): [DoyogifDetail!]

    # 历史上的今天
    todayInHistory(date: String): [TodayInHistory]

    # 七牛Token
    qiniuToken: QiniuToken

    # 新闻资讯
    NewsList(first: Int, skip: Int, keyword: String, pageToken: String): [News]
    _newsMeta: NewsMeta!
    NewsDetail(_id: String!): News
  }
  type Mutation {

    # 用户登录
    userLogin(username: String!, password: String!): UserLoginResult!
    userLoginByPhonenumberCode(countryCode: String!, purePhoneNumber: String!, code: String!): UserLoginResult!
    userRegister(input: UserRegisterInput): UserRegisterResult!
    getPhoneNumberCode(countryCode: String!, purePhoneNumber: String!): Result!
    updateUserInfo(input: UpdateUserInfoInput): Result!
    updateUserEmail(email: String!): Result!
    updateUserPhonenumber(countryCode: String!, purePhoneNumber: String!, code: String!): Result!
    updateUserPassword(input: UpdateUserPasswordInput): Result!

    # 创建文章
    createArticle(input: ArticleInput): Result!
    updateArticle(input: ArticleInput, _id: String): Result!

    # 删除文章
    deleteArticle(_id: String): Result!

    # 创建说说
    DynamicCreate(input: DynamicInput): CreateDynamicResult!
    DynamicUpdate(input: DynamicInput, _id: String!): CreateDynamicResult!
    CheckNewDynamic(latest: String): Result!
    RemoveDynamic(_id: String): Result!

    # 创建评论
    createComment(content: String!, session: String!, replyTo: String, commentTo: String): CreateCommentResult!

    # 删除评论
    deleteComment(_id: String): Result!

    # 赞
    zan(_id: String): Result!

    # 关注
    follow(_id: String): Result!

    # 喜欢
    like(id: String!, status: Int): Result!

  }
`;
