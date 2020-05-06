const express = require('express'); // importing a CommonJS module
const hubsRouter = require('./hubs/hubs-router.js');
const morgan = require("morgan");
const helmet = require("helmet");

const server = express();

// global middleware
server.use(express.json()); // built in middleware
server.use(morgan("combined")); // third party MW
server.use(helmet());

// our middleware uses the three amigas
// replaced by morgan
// server.use(function (req, res, next) {
//   const today = new Date().toISOString();
//   console.log(`[${today}] ${req.method} to ${req.url}`)
//   next(); // moves on the next piece of middleware
// })

/* !Making Custom Middleware!
check headers to see if there is a password property
if there is, check that it is "mellon"
  if there is, call next();
  otherwise return status 401 and {you: "cannot pass!"}
if there is no password return status 400 and { message:'speak friend and enter'}
*/
const gate = (req, res, next) => {
  const password = req.headers.password;
  if (password) {
    if (password === 'mellon') {
      next();
    } else {
      res.status(401).json({ message: 'cannot pass!' })
    }
  } else {
    res.status(400).json({ message: 'speak friend and enter' })
  }
}
// server.use(gate);

server.use('/api/hubs', gate, role("dwarf"), hubsRouter);
// role isn't middleware, but must return a middleware function
function role(roleName) {
  return function (req, res, next) {
    let role = req.headers.role

    if (role === roleName) {
      next();
    } else {
      res.status(403).json({ you: 'have no power here' })

    }
  }
}

server.get('/moria', gate, (req, res) => {
  res.status(200).json({ welcome: "friends" })
})

// error handler middleware has 4 arguments
// call from anywhere downstream by passing something in the next()
function errorHandler(error, req, res, next) {
  res.status(500).json({message: error.message})
}

// before the request handler runs, have a middleware that makes your name available to display

/* class solution w/o adding .header to server.get
function addName(name) {
   return (req, res, next) => {
         req.name = name;
         next();
   }
}
*/
const name = (req, res, next) => {
  const name = req.headers.name;
  if (name) {
    next();
  } else {
     next(new Error("Database Error")); // this calls the errorHandler
    res.status(400).json({ message: 'Give us your name, Stranger.' })
  }
}

server.get('/', name,(req, res) => {
  const name = (req.headers.name) ? ` ${req.headers.name}` : ' stranger';

  res.send(`
    <h2>Lambda Hubs API</h2>
    <p>Welcome${name} to the Lambda Hubs API</p>
    `);
});

server.use(errorHandler)

module.exports = server;
