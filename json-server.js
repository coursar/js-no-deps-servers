import http from 'http';
import crypto from 'crypto';
import fs from 'fs';

const slow = (next) => (req, res) => {
  setTimeout(() => next(req, res), 5000);
};

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

const json = (next) => (req, res) => {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    next(req, res);
    return;
  }

  const body = [];
  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    try {
      req.body = JSON.parse(Buffer.concat(body).toString());
      req.bodyType = 'json';
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'invalid json' }));
      return;
    }
    next(req, res);
  });
};

const image = (next) => (req, res) => {
  if (!req.headers['content-type']?.startsWith('image/')) {
    next(req, res);
    return;
  }

  const body = [];
  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    try {
      req.body = Buffer.concat(body);
      req.bodyType = 'image';
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'invalid image' }));
      return;
    }
    next(req, res);
  });
};

const posts = [];
let nextPostId = 1;

const handler = (req, res) => {
  if (req.bodyType === 'image') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      image: crypto.randomBytes(32).toString('base64url'),
    }));
    return;
  }

  if (req.bodyType !== 'json') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'json expected' }));
    return;
  }

  const post = { ...req.body, id: nextPostId };
  posts.push(post);
  nextPostId += 1;

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(post));
};

const server = http.createServer(cors(slow(json(image(handler)))));
server.on('connection', (conn) => {
  conn.pipe(process.stdout);
});
const port = process.argv[2] ?? 9999;
server.listen(port, () => {
  console.log(`server started on localhost:${port}`);
});
