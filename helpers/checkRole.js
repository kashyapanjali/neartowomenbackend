const checkRole = (roles) => {
  //actual middleware that gets executed for incoming requests
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // For profile routes, allow access if the user is accessing their own profile
    if (req.path === '/profile' && req.user.userId) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    } 
    // go to the next middleware means the request is allowed to continue to the route handler
    next();
  };
};

module.exports = checkRole;

