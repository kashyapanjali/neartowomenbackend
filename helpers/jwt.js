const { expressjwt } = require('express-jwt');

function authJwt() {
  const secret = process.env.secret;
  const api = process.env.API_URL;
  return expressjwt({
    secret,
    algorithms: ['HS256'],
    isRevoked: isRevoked,
  }).unless({
    path: [
      { url: /\/api\/products(.*)/, methods: ['GET', 'OPTIONS'] },
      { url: /\/api\/category(.*)/, methods: ['GET', 'OPTIONS'] },
      `${api}/users/login`, // Allow for user register
      `${api}/users/register`, // Allow for user login
    ],
  });
}

async function isRevoked(req, token) {
  if (!token.payload.isAdmin) {
    return true; // Reject the request if not an admin
  }
  return false;
}
module.exports = authJwt;
