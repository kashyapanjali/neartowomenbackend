const { expressjwt } = require('express-jwt');

function authJwt() {
  const secret = process.env.secret;
  const api = process.env.API_URL;
  
  console.log('JWT Secret:', secret); // Debug: Check if secret is loaded
  console.log('API URL:', api); // Debug: Check API URL
  
  return expressjwt({
    secret,
    algorithms: ['HS256'],
    requestProperty: 'user',
    getToken: function fromHeaderOrQuerystring(req) {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const token = req.headers.authorization.split(' ')[1];
        console.log('Received token:', token ? 'Token exists' : 'No token'); // Debug
        return token;
      }
      console.log('No Authorization header found'); // Debug
      return null;
    }
  }).unless({
    path: [
      { url: /\/api\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
      { url: /\/api\/products(.*)/, methods: ['GET', 'OPTIONS'] },
      { url: /\/api\/category(.*)/, methods: ['GET', 'OPTIONS'] },
      { url: /\/favicon\.ico/, methods: ['GET', 'OPTIONS'] },
      `${api}/users/login`,
      `${api}/users/register`,
      `${api}/users/register-admin`
    ],
  });
}

module.exports = authJwt;