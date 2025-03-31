import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authorizeToken  from '../utilities/authorize-token.js';
import { executeWriteQuery, executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Test a route
router.get('/test', async (req, res) => {
    try {
        Logger.log('Successful GET request on api/user/test');
        res.status(200).json({ message: 'Successful GET request.' });
        return;

    } catch (err) {
        Logger.error('An error occured in api/user/test');
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured. Check console for more information.' });
        return;
        
    }
});

export default router;