// Log everything to stderr so iisnode shows it
process.on('uncaughtException', (err) => {
  process.stderr.write('UNCAUGHT: ' + err.stack + '\n');
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  process.stderr.write('UNHANDLED: ' + (err && err.stack || err) + '\n');
});

// iisnode passes a named pipe path in PORT — pass it through as-is
process.env.HOSTNAME = '0.0.0.0';

try {
  require('./server.js');
} catch (err) {
  process.stderr.write('REQUIRE ERROR: ' + err.stack + '\n');
  process.exit(1);
}
