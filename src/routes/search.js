const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');
const extractNonEpisodeData = require('../extractNonEpisodeData');

router.get('/', async (req, res) => {
    try {
        const queryPhrase = req.query.keyword?.trim() || 'AOT';

        const { data } = await axios.get(`https://yugenanime.tv/discover/?q=${encodeURIComponent(queryPhrase)}`, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
        });
        const $ = cheerio.load(data);
        const animeElements = $('a.anime-meta').toArray();

        if (animeElements.length === 0) {
            return res.status(404).json({ error: 'No results found for the specified keyword' });
        }

        const results = extractNonEpisodeData($, animeElements);
        res.json(results);
    } catch (error) {
        console.error('Error occurred while fetching anime data:', error.message);
        res.status(500).json({
            error: 'Failed to fetch data. Please try again later.',
            details: error.response?.statusText || error.message,
        });
    }
});

module.exports = router;
