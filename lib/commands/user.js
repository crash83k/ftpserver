export default function (cmd, username) {
  if (this.username && this.username !== username) return this.reply(530, 'Username already set');
  this.username = username;
  if (this._server._meta.allowAnonymous) {
    this.authenticated = true;
    return this.reply(230);
  }
  return this.reply(331);
}
