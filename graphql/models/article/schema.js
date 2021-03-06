export default `
  type ArticleMeta {
    count: Int!
  }
  type Article {
    _id: String!
    createdAt: Date!
    updatedAt: Date!

    # 标题
    title: String!
    """
    文档 [API](http://example.com)!
    """
    html: String!
    json: String!
    cover: String
    user: User
    description: String
    
    commentCount: Int
    likeCount: Int
    likeStatus: Int
  }
  input ArticleInput {
    title: String!
    html: String!
    json: String!
    tags: [String]
    description: String
    cover: String
    type: String
  }
`;
