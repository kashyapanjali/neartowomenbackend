## NearToWomen Backend

A simple Node.js/Express backend for the NearToWomen project. This service provides APIs for users, products, categories, carts, and orders, with MongoDB as the database.Basically it provides women related product that is related to wellness, safety, menstrual and supplement

### Tech stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT
- **Middleware**: Error-handling, Authorization

### Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with values similar to:
   ```bash
   MONGODB_URI=""
   JWT_SECRET=your-secure-secret
   PORT=5000
   ```
3. Start the server:
   ```bash
   npm start
   ```
   Or run in dev mode (if defined):
   ```bash
   npm run dev
   ```

### Project structure (high-level)
- `index.js` / `api.js`: App entry and server setup
- `routes/`: Express routes (users, products, categories, orders, cart, payments)
- `models/`: Mongoose schemas and models
- `helpers/`: Utilities (JWT, validation, role checks, rate limiting, error handling)
- `config/`: Database configuration and docs
- `public/uploads/`: Uploaded assets

### Common scripts
- **npm start**: Runs the server
- **npm run dev**: Runs with hot-reload (if configured)

### Notes
- Ensure MongoDB is running and reachable via `MONGODB_URI`.
- Keep `JWT_SECRET` private and strong.

### License
This code is intended for the NearToWomen project. In future, we can add license as needed.