import jwt from 'jsonwebtoken';

const authorizeToken = (req, res, next) => {
    // Check for token in cookies
    const token = req.cookies['token'];
    if (!token) {
        console.error('Token is missing while attempting to retrieve sensitive information');
        return res.status(401).json({ message: 'Invalid token. Unable to retrieve information' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error('Invalid token provided by the user is detected.');
            return res.status(401).json({ message: 'Invalid token. Unable to retrieve information' });
        }
        
        // Send the decoded information to the next middleware
        req.user = decodedToken;
        next();
    });
};

export default authorizeToken;