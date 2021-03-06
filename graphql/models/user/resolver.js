import { AuthenticationError, ApolloError } from 'apollo-server';
import { stringify } from 'query-string';
import User from '@/mongo/models/user';
// import Oauth from '@/mongo/models/oauth';
import { getUserToken } from '@/utils/jwt';
import { sentSMS } from '@/utils/sms';
import { randomCode, checkPasswordStrength } from '@/utils/common';
import { setAsync, getAsync } from '@/utils/redis';
import { md5Encode } from '@/utils/crypto';
import { userLoader } from '@/mongo/models/user/dataloader';
import { oauthsLoader } from '@/mongo/models/oauth/dataloader';
import { sendMail, getVerifyMailTemplate } from '@/server/mail/exqq';
import { followStatusLoader, followCountLoader, fansCountLoader } from '@/mongo/models/follow/dataloader';
import { userDynamicCountLoader } from '@/mongo/models/dynamic/dataloader';

function getKey(phone, code) {
  return `purePhoneNumber=${phone}&code=${code}`;
}

function getPhone(countryCode, purePhoneNumber) {
  switch (countryCode) {
    case '+86':
      return purePhoneNumber;
    default:
      return countryCode + purePhoneNumber;
  }
}

export default {
  Query: {
    userInfo: async (root, args, ctx) => {
      const { user } = ctx;
      if (!user) {
        throw new AuthenticationError('用户未登录');
      }
 
      const data = await userLoader.load(user);
  
      if (!data) {
        throw new ApolloError('用户不存在', 403, {
          test: 'xxx',
        });
      }
      return data;
    },

    userInfoById: async (root, args, ctx) => {
      const { _id } = args;
      if (!_id) {
        throw new AuthenticationError('用户_id不存在');
      }
 
      const data = await userLoader.load(_id);
  
      if (!data) {
        throw new ApolloError('用户不存在', 403, {
          test: 'xxx',
        });
      }
      return data;
    },

    // userCommunityInfo: async (root, args, ctx) => {
    //   const { user } = ctx;
    //   if (!user) {
    //     throw new AuthenticationError('用户未登录');
    //   }
 
    //   const data = await userLoader.load(user);
  
    //   if (!data) {
    //     throw new ApolloError('用户不存在', 403, {
    //       test: 'xxx',
    //     });
    //   }
    //   return data;
    // },

    // userOauth: async (root, args, ctx) => {
    //   const { user } = ctx;
    //   if (!user) {
    //     throw new AuthenticationError('用户未登录');
    //   }

    //   const data = await Oauth.find({ user }); 
    //   return data;
    // },
  },
  Mutation: {
    userLogin: async (root, args, ctx, op) => {
      console.log('args');
      console.log(args);
      try {
        const { password, username } = args;
        
        let type;
        if (username.indexOf('@') !== -1) {
          type = 'email'
        } else {
          type = 'phoneNumber'
        }

        const user = await User.findOne({[type]: username}).lean();
        const pwMd5 = md5Encode(password);
        if (user && `${pwMd5}` === user.password) {
          const token = await getUserToken(user._id);
          return {
            status: 200,
            message: '登录成功',
            token,
            userInfo: user,
          };
        } else {
          return {
            status: 403,
            message: '用户名或密码不正确',
          };
        }
      } catch (error) {
        return {
          status: 403,
          message: '登录失败',
          error,
        };
      }
    },

    getPhoneNumberCode: async (root, args, ctx, op) => {
      try {
        const { countryCode, purePhoneNumber: phone } = args;

        if (!countryCode) {
          return {
            status: 401,
            message: '参数不正确，缺少国家',
          };
        }

        if (!phone) {
          return {
            status: 401,
            message: '参数不正确，缺少手机号',
          };
        }

        const code = randomCode();
        const key = getKey(phone, code);
        const expire = 5 * 60;
        const data = await sentSMS(phone, code);
        if (data && data.Code === 'OK') {
          await setAsync(key, code, 'EX', expire);
          return {
            status: 200,
            message: `验证码已发送到：${phone}, 5分钟内有效`,
          };
        } else {
          return {
            status: 403,
            message: '验证码发送失败',
          };
        }
      } catch (error) {
        console.log('error');
        console.log(error);
        return {
          status: 403,
          message: '验证码发送失败',
        };
      }
    },

    userLoginByPhonenumberCode: async (root, args, ctx, op) => {
      try {
        const { code, countryCode, purePhoneNumber } = args;

        // 校验手机验证码
        const phone = getPhone(countryCode, purePhoneNumber);
        const key = getKey(phone, code);
        const _code = await getAsync(key);
        if (code !== _code) {
          return {
            status: 401,
            message: '验证码不正确',
          };
        }

        const user = await User.findOne({
          phoneNumber: phone,
        });
        if (user) {
          const token = await getUserToken(user._id);
          return {
            status: 200,
            message: '登录成功',
            token,
            userInfo: user,
          };
        }

        return {
          status: 401,
          message: '该手机号尚未注册',
        };
      } catch (error) {
        return {
          status: 403,
          message: '登录失败',
          error,
        };
      }
    },
    
    updateUserPhonenumber: async (root, args, ctx, op) => {
      try {

        const { user } = ctx;

        if (!user) {
          throw new AuthenticationError('用户未登录');
        }

        const _user = await User.findById({ _id: user });

        if(!_user) {
          return {
            status: 403,
            message: '用户不存在',
          };
        }

        const { code, countryCode, purePhoneNumber } = args;

        // 校验手机验证码
        const phone = getPhone(countryCode, purePhoneNumber);
        const key = getKey(phone, code);
        const _code = await getAsync(key);

        if (code !== _code) {
          return {
            status: 401,
            message: '验证码不正确',
          };
        }

        const _user2 = await User.findOne({ phoneNumber: phone })

        if(_user2) {
          if(_user2._id+'' === user) {
            return {
              status: 401,
              message: '手机号已绑定',
            };
          } else {
            return {
              status: 401,
              message: '手机号已绑定到其他账号',
            };
          }
        }

        await _user.updateOne({ countryCode, purePhoneNumber, phoneNumber: phone });

        return {
          status: 200,
          message: '手机号绑定成功',
        };
      } catch (error) {
        console.log('error')
        console.log(error)
        return {
          status: 403,
          message: '手机号绑定失败',
          error,
        };
      }
    },

    userRegister: async (root, args, ctx, op) => {
      try {
        const { input } = args;

        const { code, password, ...params } = input;

        // 校验手机验证码
        const phone = getPhone(params.countryCode, params.purePhoneNumber);
        const key = getKey(phone, code);
        const _code = await getAsync(key);
        if (code !== _code) {
          return {
            status: 401,
            message: '验证码不正确',
          };
        }

        let user;

        user = await User.findOne({
          nickname: params.nickname,
        });

        if (user) {
          return {
            status: 401,
            message: '昵称已被使用',
          };
        }

        user = await User.findOne({
          phoneNumber: phone,
        });

        if (user) {
          return {
            status: 401,
            message: '手机号已绑定',
          };
        }

        const pwMd5 = md5Encode(password);

        user = await User.create({
          ...params,
          username: phone,
          phoneNumber: phone,
          password: pwMd5,
          avatarUrl: 'https://imgs.react.mobi/FthXc5PBp6PrhR7z9RJI6aaa46Ue',
        });

        const token = await getUserToken(user._id);

        return {
          status: 200,
          message: '注册成功',
          token,
          userInfo: user,
        };
      } catch (error) {
        console.log('error');
        console.log(error);
        return {
          status: 500,
          message: '注册失败',
        };
      }
    },

    updateUserInfo: async (root, args, ctx, op) => {
      try {
        const { user } = ctx;

        const { input } = args;

        console.log('updateUserInfo input');
        console.log(input);

        if (!user) {
          throw new AuthenticationError('用户未登录');
        }

        await User.updateOne({ _id: user }, input);

        return {
          status: 200,
          message: '用户信息更新成功',
        };
      } catch (error) {
        return {
          status: 500,
          message: '用户信息更新失败',
        };
      }
    },

    updateUserPassword: async (root, args, ctx, op) => {
      try {
        const { user } = ctx;

        if (!user) {
          throw new AuthenticationError('用户未登录');
        }

        const { input } = args;

        console.log('updateUserPassword input');
        console.log(input);

        const { oldPassword, password } = input;

        const _user = await User.findById(user);

        if (!_user) {
          return {
            status: 401,
            message: '登录信息已失效，请重新登录',
          };
        }

        // if (!_user.username) {
        //   return {
        //     status: 403,
        //     message: '请先设置用户名',
        //   };
        // }

        if (!_user.password) {
          await _user.update({ password: md5Encode(password) });
          return {
            status: 200,
            message: '用户密码更新成功',
          };
        }

        if (!oldPassword) {
          return {
            status: 401,
            message: '用户已设置密码，请填写原密码',
          };
        }

        if (`${md5Encode(oldPassword)}` !== _user.password) {
          return {
            status: 401,
            message: '原密码不正确',
          };
        }

        // if (checkPasswordStrength(password) < 3) {
        //   return {
        //     status: 401,
        //     message: '新密码强度不足，请同时包含大小写字母及数字或特殊字符',
        //   };
        // }

        await _user.update({ password: md5Encode(password) });

        return {
          status: 200,
          message: '用户密码更新成功',
        };
      } catch (error) {
        console.log(error);
        return {
          status: 500,
          message: '用户信息更新失败',
        };
      }
    },

    updateUserEmail: async (root, args, ctx, op) => {
      try {
        const { user } = ctx;

        const { email } = args;

        console.log('updateUserEmail email');
        console.log(email);

        if (!user) {
          throw new AuthenticationError('用户未登录');
        }

        const _user = await User.findOne({ email });

        if (_user) {
          if (_user._id+'' === user) {
            return {
              status: 401,
              message: '新邮箱不能和原来相同',
            };
          } else {
            return {
              status: 403,
              message: '该邮箱已被使用',
            };
          }
        }

        const token = getUserToken({ user, email });

        console.log('token');
        console.log(token);

        await sendMail({
          to: email,
          subject: '邮箱验证',
          html: getVerifyMailTemplate({
            url: 'https://api.react.mobi/rest/mail/verify?token='+token
          }),
        });
 
        await User.updateOne(
          { _id: user },
          {
            unverified_email: email,
          },
        );

        return {
          status: 200,
          message: '用户邮箱更新成功',
        };
      } catch (error) {
        console.log(error)
        return {
          status: 500,
          message: '用户邮箱更新失败',
        };
      }
    },
  },

  User: {
    oauths: (root, args, ctx) => oauthsLoader.load(ctx.user),
    followStatus: ({ _id }, _, { user }) => (user ? followStatusLoader.load(stringify({ follow: _id, user })) : false),
    // 关注数
    follow: ({ _id }) => followCountLoader.load(_id.toString()),
    // 粉丝数
    fans: ({ _id }) => fansCountLoader.load(_id.toString()),
    // 动态数
    dynamic: ({ _id }) => userDynamicCountLoader.load(_id.toString()),
  },
};
