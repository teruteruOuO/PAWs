import express from 'express';
import { executeReadQuery } from '../utilities/pool.js';

const router = express.Router();

router.get(`/`, async (req, res) => {
    try {
        let resultQuery;
        let selectQuery;
        console.log('Initializing /api/state GET route.');

        // Retrieve currency options
        selectQuery = "SELECT STATE_CODE AS code, STATE_NAME AS name FROM STATE;";
        resultQuery = await executeReadQuery(selectQuery);
        console.log(resultQuery);

        console.log('Successfully retrieved state options');
        res.status(200).json({ message: 'Successfully retrieved state options.', states: resultQuery });
        return;

    } catch (err) {
        console.error(`Error: A server error occured in /api/state GET route.`);
        console.error(err);
        res.status(500).json({ message: `Unable to retrieve resources. Try again later.`});
        return
    }
});

export default router;