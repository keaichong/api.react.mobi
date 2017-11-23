import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

export default {
  content: String,
  id: ObjectId,
  user: { type: ObjectId, ref: 'User' },
  replyTo: { type: ObjectId, ref: 'Comment' },
  thumbs_up: Number,
  replay_num: Number,
};
