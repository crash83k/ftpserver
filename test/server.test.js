import {expect} from 'chai';
import JSFtp from 'jsftp';

import FtpServer from '../lib/server';

describe('ftpserver //', function () {
  let client;
  let server;
  before(() => {
    server = new FtpServer({
      port: 8080
    });
    return server.listen()
    .then(() => {
      client = new JSFtp({
        host: '127.0.0.1',
        port: 8080
      });
    });
  });

  after(() => {
    server.close();
  });

  it('starts server', function (done) {
    client.auth('username', 'password', (err, data) => {
      if (err) return done(err);
      console.log(data);
    });
  });
});
