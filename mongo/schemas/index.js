import common from './common';
import article from './article';
import comment from './comment';
import oauth from './oauth';
import user from './user';
import say from './say';

export const userSchema = { ...common, ...user };
export const oauthSchema = { ...common, ...oauth };
export const articleSchema = { ...common, ...article };
export const commentSchema = { ...common, ...comment };
export const saySchema = { ...common, ...say };
