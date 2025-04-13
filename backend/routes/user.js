import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authorizeToken  from '../utilities/authorize-token.js';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import nodemailer from 'nodemailer';
import generateCode from '../utilities/generate-code.js';

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
            status: '',
            role: ''
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
                    SELECT USER_ID, USER_USERNAME, USER_PASSWORD, USER_STATUS, USER_ROLE
                    FROM USER
                    WHERE LOWER(USER_USERNAME) = LOWER(?);
                    `;
        resultQuery = await executeReadQuery(selectQuery.replace(/\s+/g, ' ').trim(), [username]);
        if (!resultQuery.length) {
            console.error(`Error: Cannot find ${username}. Failed to log the user in.`);
            res.status(404).json({ message: `Incorrect Credentials!` });
            return
        };
        userInformation.id = resultQuery[0].USER_ID
        userInformation.username = resultQuery[0].USER_USERNAME
        userInformation.password = resultQuery[0].USER_PASSWORD
        userInformation.status = resultQuery[0].USER_STATUS
        userInformation.role = resultQuery[0].USER_ROLE
        console.log(`User ${userInformation.username} Found and has an ${userInformation.status} status.`);

        // Disable user from continuing if they are not active
        if (userInformation.status === 'inactive') {
            console.error(`Error: ${userInformation} is an inactive user. Cannot proceed with the login process.`);
            res.status(401).json({ message: `Inactive user. Contact the admin to activate.`});
            return;
        }

        // Disable user from continuing if their role is undecided
        if (userInformation.role === 'undecided') {
            console.error(`Error: ${userInformation} has an undecided role. Cannot proceed with the login process.`);
            res.status(401).json({ message: `Wait for the admin's approval.`});
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
        token = jwt.sign({ userID: userInformation.id, role: userInformation.role }, process.env.JWT_SECRET, { expiresIn: '1hr' });

        // Set an http-only cookie using the provided token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 1000 // 1 hour in milliseconds
        });

        // Log user login activity
        insertQuery = "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);";
        resultQuery = await executeWriteQuery(insertQuery, [userInformation.id, `Logged in`]);
        console.log(`Successfully recorded log in activity for ${userInformation.username}`);

        console.log(`${userInformation.username} is successfully logged in.`);
        res.status(200).json({
            message: `Login Successful`,
            userID: userInformation.id, 
            role: userInformation.role
        });
        return;

    } catch (err) {
        console.error(`Error: A server error occured in /api/user/login POST route.`);
        console.error(err);
        res.status(500).json({ message: 'A server error occured. Please contact the admin for further notice.' });
        return;
    }
});

// Verify Email during signup process
router.post('/signup/verify-email', async (req, res) => {
    try {
        let transactionQuery;
        let insertQuery;
        let deleteQuery;
        let resultQuery;
        let userID;
        let { email } = req.body;
        let temporaryCredentials = { username: '', password: '' }
        const oneTimeCode = generateCode(6);
        const myEmail = {
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            },
            pool: true, // Use connection pooling
            maxConnections: 1,
            maxMessages: 5,
            rateLimit: 5,
            tls: { rejectUnauthorized: false } // Bypass certificate issues
        };
        let mailOptions = {
            from: `"Paws and Whiskers Inventory Management" <${process.env.NODEMAILER_EMAIL}>`,
            to: "",
            subject: "Email Verification",
            text: `Your code is: ${oneTimeCode}. The code will expire in 10 minutes. After that, you must resend a new code again.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        console.log(`Initializing /api/user/signup/verify-email POST route.`);

        // Throw an error if email does not exist in the body payload;
        if (!email) {
            console.error("Error: Cannot find email in the request body");
            res.status(400).json({ message: 'Cannot find email in the request body.' });
            return;
        }

        // Neutralize the email
        email = email.replace(/\s+/g, ' ').trim().toLowerCase();
        console.log(`Email is neutralized to all lowercase: ${email}`);

        // Create a temporary username and password for the email
        temporaryCredentials.username = `temporary_username${generateCode(6)}`;
        temporaryCredentials.password = `temporary_password${generateCode(6)}`;
        temporaryCredentials.password = await bcrypt.hash(temporaryCredentials.password, 10);
        console.log(`Temporary created credentials: ${temporaryCredentials.username} (username) AND ${temporaryCredentials.password} (password)`);

        // Perform a transaction for creating the user instance, inserting the code, and logging these actions
        transactionQuery = [
            {
                query: "INSERT INTO USER (USER_USERNAME, USER_PASSWORD, USER_FIRST, USER_LAST, USER_EMAIL, USER_ADDRESS, USER_CITY, STATE_CODE, USER_ZIP) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
                params: [
                    temporaryCredentials.username,
                    temporaryCredentials.password,
                    temporaryCredentials.username,
                    temporaryCredentials.username,
                    email,
                    "unknown",
                    "unknown",
                    "TX",
                    "99999"
                ]
            },
            {
                query: 'SET @user_id = LAST_INSERT_ID();',
                params: []
            },
            {
                query: "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (@user_id, ?);",
                params: [`System has temporarily created a user instance for ${email} verification for the sign up process.`]
            },
            {
                query: "DELETE FROM ONE_TIME_CODE WHERE USER_ID = @user_id;",
                params: [oneTimeCode]
            },
            {
                query: "INSERT INTO ONE_TIME_CODE VALUES (@user_id, NOW() + INTERVAL 10 MINUTE, ?);",
                params: [oneTimeCode]
            },
            {
                query: "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (@user_id, ?);",
                params: ["System created a one time code for the user to further verify their identity"]
            }
        ];
        resultQuery = await executeTransaction(transactionQuery);
        console.log(`Successfully created a temporary instance for user with the email ${email}. The transaction result is logged below:`);
        console.log(resultQuery);

        // Store the result id
        userID = resultQuery[0].insertId;
        console.log(`User id is ${userID}`);

        // Send the one-time code to the user's email
        mailOptions.to = email;
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error(`Error: An error occured while sending the code to the user. Deleting the user instance with the email ${email}`);

                deleteQuery = "DELETE FROM USER WHERE USER_EMAIL = ?;";
                resultQuery = await executeWriteQuery(deleteQuery, [email]);
                console.log(`Successfully deleted user with the email ${email}`);

                console.error(error);
                res.status(500).json({ message: 'A server error occured while sending the code to your email. Please try again' });
                return;

            } else {
                // Log successful code sent action to the databsase
                insertQuery = "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);"
                resultQuery = await executeWriteQuery(insertQuery, [userID, "System successfully sent a verification code to the user's email."]);

                console.log('Successfully sent the email verification code to the user');
                res.status(200).json({ 
                    message: `Successfully sent the code to ${email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                    email: email
                });
                return;
            }
        });

    } catch (err) {
        console.error(`Error: A server error occured in /api/user/signup/verify-email POST route.`);
        console.error(err);

        // SQL-Related Errors
        if (err.sqlMessage) {

            // Cancel verification if email does not have a proper format
            if (err.sqlMessage.includes('CHK_USER_EMAIL')) {
                console.error('Error: User provided an invalid email format');
                res.status(400).json({ message: 'Invalid email format' });
                return;
            }

            // Cancel verification if email is already taken
            if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('USER_EMAIL')) {
                console.error('Error: User provided an email that already exists in the database');
                res.status(409).json({ message: 'Email is already taken' });
                return;
            }
        }

        res.status(500).json({ message: 'A server error occured. Please contact the admin for further notice.' });
        return;
    }
});

// Resend code during signup process
router.post(`/signup/resend-code`, async (req, res) => {
    try {
        let transactionQuery;
        let insertQuery;
        let selectQuery;
        let resultQuery;
        let userID;
        let { email } = req.body;
        const oneTimeCode = generateCode(6);
        const myEmail = {
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            },
            pool: true, // Use connection pooling
            maxConnections: 1,
            maxMessages: 5,
            rateLimit: 5,
            tls: { rejectUnauthorized: false } // Bypass certificate issues
        };
        let mailOptions = {
            from: `"Paws and Whiskers Inventory Management System" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: "Verification Code Resend",
            text: `Your new code is: ${oneTimeCode}. Remember that this code will expire in 10 minutes.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        console.log('Initializing /api/user/signup/resend-code POST route.');

        // Throw an error if email does not exist in the body payload;
        if (!email) {
            console.error("Error: Cannot find email in the request body");
            res.status(400).json({ message: 'You must provide an email before continuing with the resource' });
            return;
        }

        // Make a new code instance in the database pertaining to the user (Delete any existing verification codes first)
        selectQuery = "SELECT USER_ID FROM USER WHERE USER_EMAIL = ?;";
        resultQuery = await executeReadQuery(selectQuery, [email]); 
        userID = resultQuery ? Number(resultQuery[0].USER_ID) : null;
        if (!userID) {
            console.error(`Error: Unable to find ${email} in the database`);
            res.status(404).json({ message: 'Email does not exist. Cannot resend a code. Try restarting the signup process.'});
            return;
        }
        transactionQuery = [
            {
                query: "DELETE FROM ONE_TIME_CODE WHERE USER_ID = ?;",
                params: [userID]
            },
            {
                query: "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);",
                params: [userID, "System deleted all verification code instances for the user before making a new one"]
            },
            {
                query: "INSERT INTO ONE_TIME_CODE VALUES (?, NOW() + INTERVAL 10 MINUTE, ?);",
                params: [userID, oneTimeCode]
            },
            {
                query: "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);",
                params: [userID, "System remade a new code for the user"]
            }
        ]
        resultQuery = await executeTransaction(transactionQuery);
        console.log(`Successfully created a new verification code for user ${userID} and deleted all other previous verification codes. The result is laid out below:`);
        console.log(resultQuery);

        // Send the new code to the user's email
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error('Error: An error occured while re-sending a new code to the user');
                console.error(error);
                res.status(500).json({ message: 'A server error occured while sending a new verification code to you. Please try again.' });
                return;

            } else {
                // Log successful code sent action to the databsase
                insertQuery = "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);"
                resultQuery = await executeWriteQuery(insertQuery, [userID, "System successfully sent a new verification code to the user's email"]);

                console.log('Successfully sent the email to the user');
                res.status(200).json({ 
                    message: `Successfully made a new verification code to ${email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                });
                return;
            }
        });

    } catch (err) {
        console.error(`Error: A server error occured in /api/user/signup/resend-code POST route.`);
        console.error(err);
        res.status(500).json({ message: 'A server error occured. Please contact the admin for further notice.' });
        return;
    }
});

// Verify code during signup process
router.post(`/signup/verify-code`, async (req, res) => {
    try {
        let transactionQuery;
        let selectQuery;
        let resultQuery;
        let { code, email } = req.body;
        let userID;
        console.log(`Initializing /api/user/signup/verify-code POST route.`);

        // Throw error if code or email is not in the body request
        if (!code || !email) {
            console.error(`Error: code is not in the request body; therefore, the process will not continue`);
            res.status(400).json({ message: 'Verification code and your email must both be provided to continue.'});
            return;
        }

        // Retrieve a code instance that matches the verification code provided by the user
        selectQuery = "SELECT U.USER_ID, CODE_TIMESTAMP, CODE_DESC FROM ONE_TIME_CODE O JOIN USER U ON O.USER_ID = U.USER_ID WHERE USER_EMAIL = ? AND CODE_DESC = ? AND CODE_TIMESTAMP > NOW();";
        resultQuery = await executeReadQuery(selectQuery, [email, code]);
        console.log(resultQuery);
        if (!resultQuery.length) {
            console.error(`Error: Unable to find code ${code} for ${email}. This might be already expired. User has to try again`);
            res.status(404).json({ message: `Invalid Code. Try again or resend a new one.`});
            return;
        }
        userID = resultQuery[0].USER_ID;

        // Delete this verification code and place user in the next stage of sign up process
        transactionQuery = [
            {
                query: "DELETE FROM ONE_TIME_CODE WHERE USER_ID = ?;",
                params: [userID]
            },
            {
                query: "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);",
                params: [userID, "User successfully entered the correct verification code"]
            }
        ]
        resultQuery = await executeTransaction(transactionQuery);

        console.log(`User #${userID} successfully entered the correct code`);
        res.status(200).json({ message: `User successfully verified the one time code`});
        return;

    } catch (err) {
        console.error(`Error: A server error occured in /api/user/signup/verify-code POST route.`);
        console.error(err);
        res.status(500).json({ message: 'A server error occured. Please contact the admin for further notice.' });
        return;
    }
});

// Sign up route
router.put(`/signup`, async (req, res) => {
    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        let selectQuery;
        let transactionQuery;
        let resultQuery;
        let userID;
        let {
            credentials: { username, password },
            name: { first, initial, last },
            location: { address, city, state_code, zip },
            email, phone } = req.body;
        console.log(`Initializing /api/signup PUT route.`);

        // If any required attributes are missing, throw an error
        if ( !username || !password || !first || !last || !email || !address || !city || !state_code || !zip) {
            console.error('Error: User is missing any of the required data: username, password, first and last names, address name, city, state, and location');
            res.status(400).json({ message: 'You are missing any of the required data: username, password, first and last names, address name, city, state, and location'});
            return;
        }

        selectQuery = "SELECT USER_ID FROM USER WHERE USER_EMAIL = ?;";
        resultQuery = await executeReadQuery(selectQuery, [email]);
        if (!resultQuery.length) {
            console.error(`Error: Unable to find user with email ${email}`);
            res.status(404).json({ message: `Unable to find user with the provided email. Restart the sign up process again.`});
            return
        }
        userID = resultQuery[0].USER_ID;

        /* Throw an error if password does not meet the requirements:
            - Contains at least one uppercase letter
            - Contains at least one lowercase letter
            - Contains at least one number
            - Contains at least one special character
        */
        if (!passwordRegex.test(password)) {
            Logger.error('Error: User provided a weak password');
            res.status(400).json({ message: 'Your password must contain at least one upper case and lowercase letters, one number, and one special character'});
            return;
        }

        /* Begin processing data */
        // Hash user password
        password = await bcrypt.hash(password, 10);
        console.log('Successfully hashed user password');

        // Ensure all data are in lowercase and do not contain unwanted and excessive whitespaces (except password, which is hashed)
        username = username.replace(/\s+/g, ' ').trim().toLowerCase();
        first = first.replace(/\s+/g, ' ').trim().toLowerCase();
        last = last.replace(/\s+/g, ' ').trim().toLowerCase();
        initial = typeof initial === 'string' ? initial.replace(/\s+/g, ' ').trim().toLowerCase() : null;
        phone = typeof phone === 'string' ? phone.replace(/\s+/g, ' ').trim().toLowerCase() : null;
        address = address.replace(/\s+/g, ' ').trim().toLowerCase();
        city = city.replace(/\s+/g, ' ').trim().toLowerCase();

        // Update user instance with the provided fields and log the activity
        transactionQuery = [
            {
                query: "UPDATE USER SET USER_USERNAME = ?, USER_PASSWORD = ?, USER_FIRST = ?, USER_LAST = ?, USER_INITIAL = ?, USER_PHONE = ?, USER_EMAIL_VERIFIED = ?, USER_ADDRESS = ?, USER_CITY = ?, STATE_CODE = ?,  USER_ZIP = ? WHERE USER_ID = ?;",
                params: [
                    username,
                    password,
                    first,
                    last,
                    initial,
                    phone,
                    "yes",
                    address,
                    city,
                    state_code,
                    zip,
                    userID
                ]
            },
            {
                query: "INSERT INTO USER_ACTIVITY (USER_ID, ACT_DESC) VALUES (?, ?);",
                params: [userID, "User successfully signed up and is now waiting for admin approval."]
            }
        ]

        resultQuery = await executeTransaction(transactionQuery);
        console.log(`Successfull signed user #${userID} up`);

        res.status(200).json({ message: `Sign up Successful` });
        return;

    } catch (err) {
        console.error(`Error: A server error occured in /api/user/signup PUT route.`);
        console.error(err);

        // Database-related errors
        if (err.sqlMessage) {
            // Cancel verification if username does not have a proper format
            if (err.sqlMessage.includes('CHK_USER_USERNAME')) {
                console.error('Error: User provided an invalid username format');
                res.status(400).json({ message: 'Invalid username format. Must only contain underscores and/or no spaces.' });
                return;
            }

            // Cancel verification if username is already taken
            if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('USER_USERNAME')) {
                console.error('Error: User provided a username that already exists in the database');
                res.status(409).json({ message: 'Username is already taken' });
                return;
            }

            // Cancel verification if phone does not have a proper format
            if (err.sqlMessage.includes('CHK_USER_PHONE')) {
                console.error('Error: User provided an invalid phone number format');
                res.status(400).json({ message: 'Invalid phone number format. Must only contain 10 digits.' });
                return;
            }

            // Cancel verification if username is already taken
            if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('USER_PHONE')) {
                console.error('Error: User provided a phone number that already exists in the database');
                res.status(409).json({ message: 'Phone number is already taken' });
                return;
            }

            // Cancel verification if zip does not have a proper format
            if (err.sqlMessage.includes('CHK_USER_ZIP')) {
                console.error('Error: User provided an invalid zip number format');
                res.status(400).json({ message: 'Invalid zip number format. Must only contain 5 digits.' });
                return;
            }

            // Cancel verification if initial does not have a proper format
            if (err.sqlMessage.includes('CHK_USER_INITIAL')) {
                console.error('Error: User provided an invalid initial format');
                res.status(400).json({ message: 'Invalid initial format. Must only contain 1 character.' });
                return;
            }
        }

        res.status(500).json({ message: 'A server error occured. Please contact the admin for further notice.' });
        return;
    }
});

// Remove the email associated with the temporary user instance if they don't continue signing-up
router.delete('/signup', async (req, res) => {
    try {
        let deleteQuery;
        let resultQuery;
        let { email } = req.body;
        console.log(email)
        console.log('Initalizing /api/account/sign-up DELETE route.');

        // Throw error if email is not in the body request
        if (!email) {
            console.error("Error: User's email does not exist in the body payload and cannot continue with the entire deletion process");
            res.status(400).json({ message: 'User email does not exist' });
            return;
        }

        // Delete the temporary user instance with this email
        deleteQuery = "DELETE FROM USER WHERE USER_EMAIL = ?;";
        resultQuery = await executeWriteQuery(deleteQuery, [email]);
        console.log('Successfully deleted user email');
        console.log(resultQuery);

        res.status(200).json({ message: 'Successfully deleted user email.'});
        return;

    } catch (err) {
        console.error('Error: A server error occured while deleting user instance associated with the temporary user account.');
        console.error(err);
        res.status(500).json({ message: 'A server error occured while deleting the email.' });
        return;
    }
});

// Logout route
router.post('/logout/:user_id', async (req, res) => {
    console.log('Initalizing /api/user/logout POST route');
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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