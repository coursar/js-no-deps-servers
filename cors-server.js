import http from 'http';

const cors = (next) => (req, res) => {
  const { origin } = req.headers;
  if (!origin) {
    next(req, res);
    return;
  }

  // simple solution. see note for fetch: https://fetch.spec.whatwg.org/#http-new-header-syntax
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method !== 'OPTIONS') {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    try {
      next(req, res);
      return;
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.statusCode = 204;
  res.end();
};

const handler = (req, res) => {
  const content = '<h1>Ok</h1>';
  res.end(content);
};

const server = http.createServer(cors(handler));
server.on('connection', (conn) => {
  conn.pipe(process.stdout);
});
const port = process.argv[2] ?? 9999;
server.listen(port, () => {
  console.log(`server started on localhost:${port}`);
});
