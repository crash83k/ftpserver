import net from 'net';
import when from 'when';
import _ from 'lodash';

import Client from './client';

export default class Server {
  constructor(config) {
    this._setConfig(config);
    this._clients = {};
    this._nextClientId = 0;

    this._server = net.createServer();
    this._server.on('error', err => {
      console.error('Server //', err);
    });

    this._server.on('connection', socket => {
      this._newConnection(socket);
    });

    this._server.on('close', () => {
      console.log('Server //', 'On Close');
    });
  }

  _setConfig(config) {
    this._meta = _.assign({
      host: '127.0.0.1',
      port: 21,
      allowAnonymous: false,
      timout: 30 * 1000, // 30 seconds
      disabledCommands: []
    }, config);
  }

  _newConnection(socket) {
    console.log('Server //', 'Connection');
    const client = new Client(this._nextClientId++, socket, this);
    this._clients[client._id] = client;
  }

  listen() {
    let defer = when.defer();
    this._server.listen(this._meta.port, () => {
      console.log('Listening', this._meta.port);
      defer.resolve();
    });
    return defer.promise;
  }

  closeAllClients() {
    return when.all(_.mapValues(this._clients, client => client.close()));
  }

  close(msg) {
    console.log('Server//', 'Initiating Close');
    let defer = when.defer();
    this._server.close(() => defer.resolve());
    return when.join(
      defer.promise,
      this.closeAllClients());
  }
}
