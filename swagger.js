const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const fs = require('fs');

const doc = {
  info: {
    title: 'Cari Kerja API',
    description: 'Interactive API Documentation for Cari Kerja Backend',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic'
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const outputFile = './swagger_output.json';
const routeDir = './src/routes';
const endpointsFiles = fs.readdirSync(routeDir)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .map(file => `${routeDir}/${file}`);

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log("Swagger documentation generated successfully.");
});
