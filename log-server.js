import net from 'net';

const server = net.createServer((conn) => {
  console.log('--- connected ---');
  conn.pipe(process.stdout);
  conn.on('end', () => {
    console.log('--- disconnected ---');
  });

  const content = '<h1>Ok</h1>';
  conn.write('HTTP/1.1 200 OK\r\n');
  conn.write('Content-type: text/html\r\n');
  conn.write(`Content-Length: ${content.length}\r\n`);
  conn.write('Connection: close\r\n');
  conn.write('\r\n');
  conn.write(content);
});
const port = process.argv[2] ?? 9999;
server.listen(port, () => {
  console.log(`server started on localhost:${port}`);
});
