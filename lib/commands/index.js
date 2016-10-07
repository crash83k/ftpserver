import user from './user';

export default {
  USER: {
    fn: user,
    syntax: 'USER <username>',
    help: 'Set connection username',
    noAuth: true
  }
};
