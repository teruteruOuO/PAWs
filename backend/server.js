import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Allow hidden backend variables (from .env) to be used in the application
dotenv.config();

// Disable logging during production
import './utilities/mute-console.js';

// Import routes
import user from './routes/user.js';
import state from './routes/state.js';

try {
    // Create an instance of an express application
    const app = express();

    // Add cors header to the server (Only allows certain websites to use this backend server)
    const corsOption = {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
    app.use(cors(corsOption));

    // Setup and access request body
    app.use(express.json());
    app.use(morgan('dev'));
    app.use(cookieParser(process.env.COOKIE_SECRET));

    // Setup middleware routes
    app.use('/api/user', user);
    app.use('/api/state', state);

    // Start backend server operation
    app.listen(process.env.APP_PORT, () => {
        console.log(`Server listening on port ${process.env.SERVER_URL}:${process.env.APP_PORT}`)
    });

} catch (err) {
    console.error(`Error: An error occured while starting the express server. Below is the error statement`);
    console.error(err);
    
}

