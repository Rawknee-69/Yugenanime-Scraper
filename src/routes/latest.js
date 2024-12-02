const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

router.get('/', async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const { data } = await axios.get(`https://yugenanime.tv/latest/?page=${page}`);
        const $ = cheerio.load(data);
        const results = [];

        $('li.ep-card').toArray().forEach((e) => {
            const onErrorAttr = $(e).find('img').attr('onerror');

            results.push({
                anime: {
                    name: $(e).find('.ep-origin-name').text(),
                    slug: $(e).find('a.ep-thumbnail').attr('href')?.replace('/watch/', '').split('/')[1] || '',
                    id: Number($(e).find('a.ep-thumbnail').attr('href')?.replace('/watch/', '').split('/')[0]) || null,
                },
                poster: onErrorAttr
                    ? onErrorAttr.replace("this.src='", '').replace("'", '')
                    : null, // Default to null if onerror is missing
                episodeTitle: $(e)
                    .find('.ep-title')
                    .text()
                    .split(' ')
                    .slice(2)
                    .join(' '),
                episode: Number(
                    $(e)
                        .find('a.ep-thumbnail')
                        .attr('href')
                        ?.split('/')
                        .filter((e) => e !== '')
                        .pop()
                ) || null,
                episodeDuration: $(e).find('a > div.ep-bubble.ep-duration').text() || 'N/A',
            });
        });

        res.json(results);
    } catch (error) {
        console.error('Error fetching latest episodes:', error.message);
        res.status(500).json({ error: 'Failed to fetch latest episodes' });
    }
});

module.exports = router;
