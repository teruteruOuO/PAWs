import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = () => {};
    console.error = () => {};
}
