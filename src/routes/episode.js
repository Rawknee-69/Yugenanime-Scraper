const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.get('/', async (req, res) => {
    const animeId = Number(req.query.id) || 19057;
    let animeSlug = req.query.slug || 'enter-the-garden';
    const episode = Number(req.query.episode) || 1;
    animeSlug = animeSlug.replace('-dub', '');

    let animeTitle = null;
    let title = null;
    let description = null;
    const videos = [];

    try {
       
        const responses = await Promise.allSettled([
            axios.get(`https://yugenanime.sx/watch/${animeId}/${animeSlug}/${episode}`, {
                headers: {
                    'Host': 'yugenanime.sx',
                    'Referer': `https://yugenanime.sx/`,
                    'Origin': 'https://yugenanime.sx',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    'Requested-Language': 'Subbed',
                },
            }),
            axios.get(`https://yugenanime.sx/watch/${animeId}/${animeSlug}-dub/${episode}`, {
                headers: {
                    'Host': 'yugenanime.sx',
                    'Referer': `https://yugenanime.sx/`,
                    'Origin': 'https://yugenanime.sx',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                },
            }),
        ]);

        
        responses
            .filter((result) => result.status === 'fulfilled')
            .forEach((result) => {
                const $ = cheerio.load(result.value.data);
                if (
                    Object.keys(result.value.config.headers).includes('Requested-Language') &&
                    result.value.config.headers['Requested-Language'] === 'Subbed'
                ) {
                    animeTitle =
                        animeTitle ||
                        $('#wrapper > div > div.col.col-w-65 > div:nth-child(2) > div.flex.justify-content-between.align-items-center > div:nth-child(1) > div > a.link > h1').text();

                    title =
                        title ||
                        $('#wrapper > div > div.col.col-w-65 > div.box.m-10-b.p-15.w-100 > h1')
                            .text()
                            .split(' ')
                            .slice(2)
                            .join(' ');

                    description =
                        description ||
                        $('#wrapper > div > div.col.col-w-65 > div:nth-child(3) > div:nth-child(1) > p').text() ||
                        $('#wrapper > div > div.col.col-w-65 > div:nth-child(4) > div:nth-child(1) > p').text();
                }

              
                videos.push({
                    language:
                        Object.keys(result.value.config.headers).includes('Requested-Language') &&
                        result.value.config.headers['Requested-Language'] === 'Subbed'
                            ? 'Subbed'
                            : 'Dubbed',
                    video: $('#main-embed').attr('src') || null,
                });
            });

     
        if (videos.length === 0) {
            return res.status(404).json({
                error: 'No videos found for the specified anime, slug, and episode combination.',
            });
        }

        sendPostRequest()

     
        res.json({
            anime: {
                title: animeTitle,
                slug: animeSlug,
                id: animeId,
            },
            title,
            description,
            videos,
        });
    } catch (error) {
        console.error('Error occurred while fetching anime data:', error.message);

     
        res.status(500).json({
            error: 'Failed to fetch data. Please try again later.',
            details: error.response?.statusText || error.message,
        });
    }
});

module.exports = router;
