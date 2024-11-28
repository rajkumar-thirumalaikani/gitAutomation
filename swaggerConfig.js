import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GitHub Tag Management API',
            version: '1.0.0',
            description: 'API to manage GitHub tags (create, delete, resolve merge conflicts)',
        },
        servers: [
            {
                url: 'http://localhost:5173/api',
                description: 'Local server',
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
    