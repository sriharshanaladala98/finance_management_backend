const fs = require('fs');
const path = require('path');

function parseRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const routeRegex = /router\.(get|post|put|delete|patch|options|head)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*((?:[a-zA-Z0-9_]+,\s*)*)([a-zA-Z0-9_]+)/g;
  const routes = [];
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const middlewareStr = match[3].trim();
    const middlewares = middlewareStr ? middlewareStr.split(',').map(mw => mw.trim()).filter(Boolean) : [];
    const handler = match[4];
    routes.push({ method, routePath, middlewares, handler });
  }
  return routes;
}

function getAllApiEndpoints(appJsPath, routesDir) {
  const appContent = fs.readFileSync(appJsPath, 'utf-8');
  // Match lines like: app.use("/api/users", userRoutes);
  const appUseRegex = /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*require\(['"`]\.\/\.\.\/routes\/([^'"`]+)['"`]\)\s*\)/g;
  const endpoints = [];

  let match;
  while ((match = appUseRegex.exec(appContent)) !== null) {
    const basePath = match[1];
    const routeFileName = match[2];
    const routeFilePath = path.join(routesDir, routeFileName + '.js');
    if (fs.existsSync(routeFilePath)) {
      const routes = parseRouteFile(routeFilePath);
      routes.forEach(route => {
        endpoints.push({
          method: route.method,
          path: path.posix.join(basePath, route.routePath).replace(/\\/g, '/'),
          middlewares: route.middlewares,
          handler: route.handler,
          routeFile: routeFileName + '.js'
        });
      });
    }
  }
  return endpoints;
}

module.exports = { getAllApiEndpoints };
