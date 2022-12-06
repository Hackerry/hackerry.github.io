const path = require('path');
const http = require('http');

const login = `
<!DOCTYPE HTML>
<html>
  <head><meta http-equiv="content-type" content="text/html; charset=UTF-8"></head>
  <body>
    <div>
      <h2>Login</h2>
      <form action='login' method='POST'>
        <input type='text' name='username' placeholder='Username' />
        <input type='password' name='password' placeholder='Password'/>
        <input type='submit' value='Login' />
      </form>
    </div>
  </body>
</html>
`;

const greet = `
<!DOCTYPE HTML>
<html>
  <head><meta http-equiv="content-type" content="text/html; charset=UTF-8"></head>
  <body>
    <div>
      <h2>Hi, PLACEHOLDER</h2>
    </div>
  </body>
</html>
`;

const requestListener = function(req, res) {
  if(req.url == '/') {
    res.write(login);
  } else if(req.url == '/login') {
    var body = '';
    var username = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      var params = body.split('&');
      var html = greet.replace('PLACEHOLDER', params[0].substr(params[0].indexOf('=')+1));
      res.end(html);
    });
  }
}

const server = http.createServer(requestListener);
server.listen(8080);
