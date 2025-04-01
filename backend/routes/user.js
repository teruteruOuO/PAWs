import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authorizeToken  from '../utilities/authorize-token.js';
import { executeWriteQuery, executeReadQuery } from '../utilities/pool.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        let selectQuery;
        let insertQuery;
        let resultQuery;
        let { username, password } = req.body;
        let userInformation = {
            id: '',
            username: '',
            password: '',
            status: ''
        };
        let isPasswordValid;
        let token;
        const isLoggedIn = req.cookies['token'] ? true : false;
        console.log(`Initializing /api/user/login POST route.`);

        // If user is logged in while logging in, then clear the any tokens
        if (isLoggedIn) {
            console.log(`User is currently logged in. Logging them out so they can immediately log in.`);
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            });
        }

        // Throw an error if username and password are not in the request body
        if (!username || !password) {
            console.error('Error: Username and password fields are missing while logging in.');
            res.status(400).json({ message: 'Username and password fields are missing while logging in.' });
            return;
        }

        // Find matching username
        selectQuery = `
                    SELECT USER_ID, USER_USERNAME, USER_PASSWORD, USER_STATUS
                    FROM USER
                    WHERE LOWER(USER_USERNAME) = LOWER(?);
                    `;
        resultQuery = await executeReadQuery(selectQuery.replace(/\s+/g, ' ').trim(), [username]);
        if (!resultQuery) {
            console.error(`Error: Cannot find ${username}. Failed to log the user in.`);
            res.status(404).json({ message: `Incorrect Credentials!` });
            return
        };
        userInformation.id = resultQuery[0].USER_ID
        userInformation.username = resultQuery[0].USER_USERNAME
        userInformation.password = resultQuery[0].USER_PASSWORD
        userInformation.status = resultQuery[0].USER_STATUS
        console.log(`User ${userInformation.username} Found and has an ${userInformation.status} status.`);

        // Disable user from continuing if they are not active
        if (userInformation.status === 'inactive') {
            console.error(`Error: ${userInformation} is an inactive user. Cannot proceed with the login process.`);
            res.status(401).json({ message: `Inactive user. Contact the admin to activate.`});
            return;
        }

        // Validate the body password from the database password
        isPasswordValid = await bcrypt.compare(password, userInformation.password);
        console.log(`Password validation result: ${isPasswordValid}`);
        userInformation.password = "";
        if (!isPasswordValid) {
            console.error('Error: Given password does not match the database password. Cannot proceed with the login process.');
            res.status(400).json({ message: 'Incorrect credentials!' });
            return;
        }
        console.log('Passwords match.');

        // Create token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables');
        }
        token = jwt.sign({ userID: userInformation.id }, process.env.JWT_SECRET, { expiresIn: '10s' });

        // Set an http-only cookie using the provided token
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 10 * 1000 // 1 hour in milliseconds
        });

        // Log user login activity
        insertQuery = "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);";
        resultQuery = await executeWriteQuery(insertQuery, [userInformation.id, `Logged in`]);
        console.log(`Successfully recorded log in activity for ${userInformation.username}`);

        console.log(`${userInformation.username} is successfully logged in.`);
        res.status(200).json({
            message: `Login Successful`,
            userID: userInformation.id
        });
        return;

    } catch (err) {
        console.error(`Error: A server error occured in /api/user/login POST route.`);
        console.error(err);
        res.status(500).json({ message: 'A server error occured. Please contact the admin for further notice.' });
        return;
    }
});

// Logout route
router.post('/logout/:user_id', async (req, res) => {
    console.log('Initalizing /api/user/logout POST route');
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });

    try {
        let insertQuery;
        let resultQuery;
        let { user_id } = req.params;

        // Log user logout activity
        insertQuery = "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);";
        resultQuery = await executeWriteQuery(insertQuery, [user_id, `Logged out`]);
        console.log(`Successfully recorded log out activity for user #${user_id}`);
        
    } catch (err) {
        console.error(`Error: A server error occured in /api/user/logout POST route. Logging user out without recording their log out activity`);
        console.error(err);

    }

    res.status(200).json({ message: 'Logout success' });
    return;
});

// Verify that the user still has the token while going through each authority-needed pages
router.get('/verify-token', async (req, res) => {
    const token = req.cookies['token'];

    // No token at all
    if (!token) {
        console.error('User has no token while routing to a page');
        res.status(401).json({ message: 'No token detected' });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                console.error('User token has expired');
                res.status(401).json({ 
                    message: 'Session expired: Please log in again',
                    expired: true
                });
                return;

            } else {
                console.error("User has a token that doesn't match the server's JWT secret");
                res.status(401).json({ message: 'Invalid token: Access denied' });
                return;
            }
        }

        // Token is valid
        console.log('Token is valid');
        return res.status(200).json({ message: 'Successfully entered a secure page.' });
    });
});


export default router;