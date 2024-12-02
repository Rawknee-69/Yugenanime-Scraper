const axios = require('axios');
const qs = require('qs');

const axiosInstance = axios.create({
    httpAgent: new (require('http').Agent)({ keepAlive: true }),
    httpsAgent: new (require('https').Agent)({ keepAlive: true }),
    timeout: 5000,
});

class Scrapper {
    constructor(link) {
        this.link = link;
    }

    async getEpisodePlayer() {
        try {
            const qualities = ['360', '480', '720', '1080'];
            const types = ['sub', 'dub']; 
            const result = {};

            const typeRequests = types.map((type) => this.fetchTypeData(type, qualities));

            const responses = await Promise.all(typeRequests);

            types.forEach((type, index) => {
                result[type] = responses[index];
            });

            return result;

        } catch (error) {
            console.error('Main error:', error);
            throw error;
        }
    }

    async fetchTypeData(type, qualities) {
        try {
            const url = this.getEpisodeURL(type);
            const response = await axiosInstance.get(url);
            const embedLink = this.extractEmbedLink(response.data);

            if (!embedLink) {
                throw new Error(`Embed link not found for ${type}`);
            }

            const headers = this.getHeaders(embedLink);
            const postResponse = await axiosInstance.post('https://yugenanime.tv/api/embed/', qs.stringify({ id: embedLink, ac: '0' }), { headers });

            const qualityLinks = await this.getAllQualityLinks(postResponse.data.hls, qualities, type);
            return {
                playerData: postResponse.data,
                links: qualityLinks
            };

        } catch (error) {
            console.error(`Error fetching ${type} episode:`, error);
            return { error: `Error fetching ${type} episode` };
        }
    }

    getEpisodeURL(type) {
        return this.link.replace(/(-dub)?\/\d+\/$/, type === 'dub' ? '-dub/1/' : '/1/');
    }

    extractEmbedLink(data) {
        const embedLinkMatch = data.match(/src="\/\/yugenanime.tv\/e\/(.*?)\//);
        return embedLinkMatch ? embedLinkMatch[1] : null;
    }

    getHeaders(embedLink) {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Origin': 'https://yugenanime.tv',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': `https://yugenanime.tv/e/${embedLink}/`
        };
    }

    async getAllQualityLinks(hlsLinks, qualities, type) {
        const allLinks = {};

       
        const hlsRequests = hlsLinks.map(async (hlsLink) => {
            const linksForHLS = await this.getQualityLinksForHLS(hlsLink, qualities, type);
            if (Object.keys(linksForHLS).length > 0) {
                allLinks[hlsLink] = linksForHLS;
            }
        });

        await Promise.all(hlsRequests);

        return allLinks;
    }

    async getQualityLinksForHLS(hlsLink, qualities, type) {
        const linksForHLS = {};
        const qualityRequests = qualities.map(async (quality) => {
            const qualityLink = `${hlsLink.slice(0, -5)}.${quality}.m3u8`;
            try {
                const qualityResponse = await axiosInstance.head(qualityLink);
                if (qualityResponse.status === 200) {
                    linksForHLS[quality] = {
                        url: qualityLink,
                        quality: quality,
                        type: type
                    };
                }
            } catch (error) {
                //console.log(`Quality ${quality} not available for ${type} on ${hlsLink}`);
            }
        });


        await Promise.all(qualityRequests);

        return linksForHLS;
    }
}

module.exports = Scrapper;
