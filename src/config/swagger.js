import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinica Backend API',
      version: '1.0.0',
      description: 'API REST para el sistema de gestion de turnos medicos',
    },
    servers: [
      {
        url: 'http://localhost:{port}',
        variables: {
          port: {
            default: '3000',
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RespuestaOk: {
          type: 'object',
          properties: {
            codigo: { type: 'integer', example: 200 },
            estado: { type: 'string', example: 'ok' },
            mensaje: { type: 'string', nullable: true, example: null },
            datos: { type: 'object' },
          },
        },
        RespuestaError: {
          type: 'object',
          properties: {
            codigo: { type: 'integer', example: 400 },
            estado: { type: 'string', example: 'error' },
            mensaje: { type: 'string', example: 'Mensaje de error' },
            datos: { nullable: true, example: null },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
