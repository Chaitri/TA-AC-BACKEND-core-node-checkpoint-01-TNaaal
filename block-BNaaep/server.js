const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const path = require('path');
const PORT = 5000;

const server = http.createServer(handleRequest).listen(PORT, () => {
  console.log('Server is listening on port: ', PORT);
});

function handleRequest(req, res) {
  let fileType = req.url.split('.').pop();
  let parsedUrl = url.parse(req.url, true);

  if (fileType === 'css') {
    let filePath = __dirname + '/assets/stylesheets/style.css';
    res.setHeader('Content-Type', 'text/css');
    return fs.createReadStream(filePath).pipe(res);
  }

  if (fileType === 'jpg') {
    let filePath = __dirname + url.parse(req.url, true).pathname;
    res.setHeader('Content-Type', 'image/jpg');
    return fs.createReadStream(filePath).pipe(res);
  }

  if (req.method === 'GET' && req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream('./index.html').pipe(res);
  } else if (req.method === 'GET' && req.url === '/about') {
    let filePath = __dirname + url.parse(req.url, true).pathname;
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream(filePath + '.html').pipe(res);
  } else if (req.method === 'GET' && req.url === '/contact') {
    let filePath = __dirname + url.parse(req.url, true).pathname;
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream(filePath + '.html').pipe(res);
  } else if (req.method === 'POST' && req.url === '/form') {
    let userData = '';
    req.on('data', (chunk) => {
      userData += chunk;
    });

    req.on('end', () => {
      let parsedUserData = qs.parse(userData);
      let username = parsedUserData.username;
      let contactsDir = path.join(__dirname, '/contacts', username);
      fs.open(contactsDir + '.json', 'wx', (err, fd) => {
        if (err)
          return res.end('Username is already taken, please choose another.');
        else {
          fs.writeFile(fd, JSON.stringify(parsedUserData), (err) => {
            if (err) return res.end('Error occurred while saving user.');
            else {
              fs.close(fd, (err) => {
                if (err) return res.end('Error occurred while saving user.');
                else res.end(`User ${username}'s contact has been saved`);
              });
            }
          });
        }
      });
    });
  } else if (req.method === 'GET' && req.url === '/users') {
    let contactsDir = path.join(__dirname, '/contacts');
    fs.readdir(contactsDir, (err, files) => {
      if (err) return console.error(err);
      else {
        let htmlResponse = '';
        files.forEach((file) => {
          let filePath = path.join(contactsDir, file);
          let userFile = JSON.parse(fs.readFileSync(filePath));
          htmlResponse += sendHTMLResponse(userFile);
        });
        res.setHeader('Content-Type', 'text/html');
        res.end(htmlResponse);
      }
    });
  } else if (req.method === 'GET' && parsedUrl.pathname === '/users') {
    let username = parsedUrl.query.username;
    let contactFile = path.join(__dirname, '/contacts', username);
    res.setHeader('Content-Type', 'text/html');
    let userFile = '';
    userFile = JSON.parse(fs.readFileSync(contactFile + '.json'));
    let htmlResponse = sendHTMLResponse(userFile);
    res.end(htmlResponse);
  }
}

function sendHTMLResponse(userObj) {
  let htmlResponse = `
  <h1>User Info</h1>
  <h3>Name: ${userObj.name}</h3>
  <h3>Email: ${userObj.email}</h3>
  <h3>Username: ${userObj.username}</h3>
  <h3>Age: ${Number(userObj.age)}</h3>
  <h3>Bio: ${userObj.bio}</h3>
  <hr/>
  `;
  return htmlResponse;
}
