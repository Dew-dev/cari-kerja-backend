const fs = require('fs');

const swaggerFile = './swagger_output.json';
const data = JSON.parse(fs.readFileSync(swaggerFile, 'utf8'));

Object.keys(data.paths).forEach(path => {
  // Extract category from path: e.g. /api/v1/jobposts/something -> ["api", "v1", "jobposts", "something"]
  const parts = path.split('/').filter(Boolean); 
  const categoryStr = parts[2] || 'General'; 
  
  // Format to Title Case
  const tagName = categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1).replace(/_/g, ' ');

  Object.keys(data.paths[path]).forEach(method => {
    const route = data.paths[path][method];

    // 1. Assign Tags
    route.tags = [tagName];

    // 2. Add Filter / Pagination for GET (list) endpoints
    if (method.toLowerCase() === 'get' && !path.includes('{id}')) {
      if (!route.parameters) route.parameters = [];
      
      const hasParam = (name) => route.parameters.some(p => p.name === name);
      
      if (!hasParam('page')) {
        route.parameters.push({
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 1 },
          description: 'Page number for pagination'
        });
      }
      if (!hasParam('limit')) {
        route.parameters.push({
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 10 },
          description: 'Number of items per page'
        });
      }
      if (!hasParam('search')) {
        route.parameters.push({
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Search keyword for filtering'
        });
      }
    }

    // 3. Add Examples for POST/PUT request bodies
    if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
        if (!route.requestBody) {
            route.requestBody = {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                exampleField: { type: "string" }
                            }
                        },
                        example: {
                            "note": "Auto-generated example. Replace fields according to actual requirements."
                        }
                    }
                }
            };
        } else if (route.requestBody.content && route.requestBody.content['application/json']) {
            route.requestBody.content['application/json'].example = {
                "note": "Auto-generated example payload from format-swagger.js."
            };
        }
    }
  });
});

fs.writeFileSync(swaggerFile, JSON.stringify(data, null, 2));
console.log('Swagger documentation formatted with tags, filters, and examples.');
