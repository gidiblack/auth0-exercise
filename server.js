const express = require('express'); // import express
require('dotenv').config(); // get access to environment variables(.env) within this file
const jwt = require('express-jwt'); // validate JWT and set req.user
const jwksRsa = require('jwks-rsa'); // Retrieve RSA keys from a public JSON Web Key Set (JWKS) enpoint exposed by Auth0
const checkScope = require('express-jwt-authz'); // Validate JWT scopes

const checkJwt = jwt({
  // Dynamically provide a signing key based on the id in the header and the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true, // cache the signing key
    rateLimit: true,
    jwksRequestsPerMinute: 5, // prevent attackers from requesting more than 5 per minute
    jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
  algorithm: ['RS256'], // this must match the algorithm selected in the Auth0 dashboard under app's advanced settings
});

// instantiate express
const app = express();

// declare public endpoint that receives a request and a response
app.get('/public', function (req, res) {
  res.json({
    message: 'Hello from a public API',
  });
});

// declare private endpoint that checks for a valid JWT then receives a request and a response
app.get('/private', checkJwt, function (req, res) {
  res.json({
    message: 'Hello from a private API',
  });
});

// declare course endpoint that checks that the user has the requested scope then receives a request and a response
app.get('/course', checkJwt, checkScope(['read:courses']), function (req, res) {
  res.json({
    courses: [
      { id: 1, title: 'The first course' },
      { id: 2, title: 'The second course' },
    ],
  });
});

// declare express middleware (checkRole) which must return a function that accepts 3 params - req, res, next
function checkRole(role) {
  return function (req, res, next) {
    const assignedRoles = req.user['http://localhost:3000/roles'];
    // check if the user's assigned roles include the role that's being parsed in when the middleware is called
    if (Array.isArray(assignedRoles) && assignedRoles.includes(role)) {
      // if role is found, return next() to allow processing to continue
      return next();
    } else {
      // if role not found, throw error
      return res.state(401).send('Insufficient role');
    }
  };
}

app.get('/admin', checkJwt, checkRole('admin'), function (req, res) {
  res.json({
    message: 'Hello from an admin API',
  });
});

// declare which port to listen on
app.listen(3001);
console.log('API server listening on ' + process.env.REACT_APP_API_URL);
