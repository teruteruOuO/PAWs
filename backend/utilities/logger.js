import dotenv from 'dotenv';
dotenv.config();

class Logger {
    static log = console.log.bind(console); // Default logging behavior
    static error = console.error.bind(console); // Default error behavior

    static initialize() {
        if (process.env.NODE_ENV === 'production') {
            // Disable logs and errors in production
            Logger.log = () => {};
            Logger.error = () => {};
        }
    }
}
  
// Initialize the logger based on the environment
Logger.initialize();

export default Logger;