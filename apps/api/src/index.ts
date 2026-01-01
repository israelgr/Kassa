import { app } from './app.js';
import { config } from './config/index.js';
import { initializeDatabase } from './db/connection.js';

// Initialize database
initializeDatabase();

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Environment: ${config.isProduction ? 'production' : 'development'}`);
});
