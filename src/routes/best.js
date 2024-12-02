const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.get('/', async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const { data } = await axios.get(`https://yugenanime.tv/best/?page=${page}`);
        const $ = cheerio.load(data);

        const animeList = $('a.anime-meta').map((i, el) => {
            const title = $(el).find('.anime-name').text().trim();
            const url = $(el).attr('href');
            const image = $(el).find('.anime-poster__container img').attr('data-src');
            const season = $(el).find('.anime-details span').first().text().trim();
            const rating = $(el).find('.anime-options .option').text().replace(/[^0-9.]/g, '').trim(); 
            const dubAvailable = $(el).find('.ani-exclamation').text().includes('Dub');

            return {
                title,
                url,
                image,
                season,
                rating: rating ? parseFloat(rating) : null,  
                dubAvailable,
            };
        }).get();


        res.json(animeList);
    } catch (error) {
        console.error("Error scraping YugenAnime trending:", error);
        res.status(500).json({ error: "Failed to scrape data" });
    }
});

module.exports = router;