// iisnode passes the port via a named pipe in process.env.PORT
// Next.js standalone server.js defaults to port 3000
// This wrapper ensures the correct port is used
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = '0.0.0.0';
require('./server.js');
