/**
 * LOCAL MOTION 3D WEBSITE - APPLICATION SERVER & SERVERLESS ENTRYPOINT
 * 
 * NOTE: The client-side 3D canvas animation script is located in `client.js`.
 * This file serves as the Node.js / AWS Lambda / Vercel server entrypoint.
 */

const serverModule = require('./server.js');

// Standard Node.js HTTP request listener (Vercel, Express, Node http)
const app = (req, res) => {
  return serverModule.handleNodeRequest(req, res);
};

// AWS Lambda / Serverless Framework / AWS Amplify handler
app.handler = async (event, context) => {
  return serverModule.handler(event, context);
};

// CommonJS and default exports
module.exports = app;
module.exports.handler = app.handler;
module.exports.default = app;

// Auto-start server if executed directly via CLI: `node app.js`
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  serverModule.server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Motion Drink 3D Website running at:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}
