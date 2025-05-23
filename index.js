import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/jobs', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const response = await axios.get(`https://remotive.io/api/remote-jobs`, {
      params: { search: searchQuery },
    });

    res.json(response.data); // send job data to frontend
  } catch (error) {
    console.error('Error fetching from Remotive:', error.message);
    res.status(500).json({ error: 'Failed to fetch jobs from Remotive' });
  }
});

export default router;
