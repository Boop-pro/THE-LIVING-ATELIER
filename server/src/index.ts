import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🎨 The Living Atelier API Server`);
  console.log(`📍 Listening on: http://localhost:${config.port}`);
  console.log(`🌱 Environment:  ${config.nodeEnv}`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
  console.log(`====================================================`);
});
