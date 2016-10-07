import when from 'when';

import commands from './commands';
import messages from './messages';

export default class Client {
  constructor(id, socket, server) {
    this._id = id;
    this._socket = socket;
    this._socket.setTimeout(0);
    this._socket.setNoDelay();

    this._server = server;

    this._commandQueue = [];
    this._commandQueueRunning = false;

    this._socket.on('error', err => {
      console.error('Client //', err);
    });

    this._socket.on('data', buffer => {
      this._receiveCommand(buffer);
    });

    this._socket.on('close', () => {
      console.log('Client //', 'Close');
      delete this._server[this._id];
    });

    this._socket.on('timeout', () => {
      console.log('Client //', 'Timeout');
    });
  }

  write(message, _socket = null) {
    const defer = when.defer();
    const socket = _socket || this._socket;
    if (socket && socket.writeable) defer.reject(new Error('Socket not writable'));
    console.log('write', message);
    socket.write(message + '\r\n', 'utf-8', defer.resolve);
    return defer.promise;
  }

  reply(code, msg, {eol = true, socket = null} = {}) {
    const message = msg || messages[code] || 'No information';
    return this.write(code + (eol ? ' ' : '-') + message, socket);
  }

  close(code = 421) {
    return this.reply(code, 'Closing connection')
    .then(() => this._socket.end());
  }

  _receiveCommand(buffer) {
    const rawCommands = this._readBuffer(buffer);
    const userCommands = this._getCommands(rawCommands);
    userCommands.forEach(command => {
      this._commandQueue.push(command);
      if (!this._commandQueueRunning) {
        this._commandQueueRunning = true;
        this._runCommandQueue();
      }
    });
  }

  _readBuffer(buffer) {
    return buffer.toString('utf-8')
      .split('\n')
      .filter(b => !!b)
      .map(cmd => cmd.trim());
  }

  _getCommands(rawCommands) {
    return rawCommands.map(raw => {
      const [cmd, ...args] = raw.split(' ');
      return { cmd: cmd.toLocaleUpperCase(), args };
    });
  }

  _runCommandQueue() {
    if (!this._commandQueue.length) {
      this._commandQueueRunning = false;
      return;
    }
    const command = this._commandQueue.shift();
    this._processCommand(command)
    .finally(() => this._runCommandQueue());
  }

  _processCommand({cmd, args}) {
    console.log(cmd, args);
    if (!commands.hasOwnProperty(cmd)) {
      return this.reply(502);
    }

    if (~this._server._meta.disabledCommands.indexOf(cmd)) {
      return this.reply(502, 'Command not allowed');
    }

    const commandHandle = commands[cmd];
    if (!this._server._meta.allowAnonymous && !this.authenticated && !commandHandle.noAuth) {
      return this.reply(530, 'Command requires authentication');
    }

    return commandHandle.fn.apply(this, [cmd].concat(args));
  }
}
