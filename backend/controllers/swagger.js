const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',  // OpenAPI version
    info: {
      title: 'Inventory Management API',  // API title
      version: '1.0.0',  // API version
      description: 'API documentation for the Inventory Management application',  // API description
    },
    servers: [
      {
        url: 'http://localhost:5001/api',  // Base URL for your API
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
  // Path to your route and controller files (adjust paths as needed)
};

// Generate Swagger docs
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware function to serve Swagger UI and Docs
const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = swaggerSetup;
