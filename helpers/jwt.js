const { expressjwt } = require('express-jwt');

function authJwt() {
  const secret = process.env.secret;
  const api = process.env.API_URL;
  
  
  return expressjwt({
    secret,
    algorithms: ['HS256'],
    requestProperty: 'user',
    getToken: function fromHeaderOrQuerystring(req) {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const token = req.headers.authorization.split(' ')[1];
        return token;
      }
      return null;
    }
  }).unless({
    // without authencation that routes allows and option use for cors validation
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