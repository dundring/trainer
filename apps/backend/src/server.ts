import { mailService, monitoringService, stravaService } from './services';
import * as express from 'express';
import * as WebSocket from 'ws';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { initRedis } from './redis';
import { initWebsockets } from './websocket';
import router from './routes';
import { logger } from './logger';

require('dotenv').config();

// Create a new express app instance
const app = express.default();

const httpPort = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use('/api', router);

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer, path: '/api' });

const checkEnvConfig = () => {
  if (!process.env.PORT) {
    console.log(
      '[.env]: No port provided; using 8080. Override this by setting the PORT in the environment config.'
    );
  }

  if (!process.env.TOKEN_SECRET) {
    console.log(
      '[.env]: No token secret provided; using 12345. Override this by setting the TOKEN_SECRET in the environment config.'
    );
  }

  if (!process.env.REDIS_URL) {
    console.log(
      '[.env]: No Redis URL provided; using `redis://127.0.0.1:6380`:. Override this by setting the PORT in the environment config.'
    );
  }

  mailService.checkMailConfig();
  stravaService.checkStravaConfig();
  monitoringService.checkMonitoringConfig();
};

checkEnvConfig();

initWebsockets(wss);
initRedis();

// TODO: figure out why a connect is triggered several times.
//       This is probably due to some fishy rerender.

httpServer.listen(httpPort, () => {
  console.log(`App is listening on port ${httpPort}!:)`);
  logger.info(`App is listening on port ${httpPort}!:)`);
});
