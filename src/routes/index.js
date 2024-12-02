const express = require('express');
const router = express.Router();
const Scrapper = require('./scraper'); 

router.get("/", (req, res) => {
  res.json([
    {
      route: "/latest",
      query: ["?page=", "default page = 1"],
    },
    {
      route: "/trending",
      query: ["?page=", "default page = 1"],
    },
    {
      route: "/best",
      query: ["?page=", "default page = 1"],
    },
    {
      route: "/search",
      query: ["?keyword=", "default phrase = shield hero"],
    },
    {
      route: "/details",
      query: [
        "?id=",
        "&slug=",
        "default id = 5792",
        "default slug = tate-no-yuusha-no-nariagari",
      ],
    },
    {
      route: "/episode",
      query: [
        "?id=19057",
        "&slug=enter-the-garden",
        "&episode=1",
      ],
    },
    {
      route: "/scrap",
      query: ["?url=", "default example = https://yugenanime.tv/watch/16117/aotu-campus/1/"],
    },
  ]);
});


router.use("/latest", require("./latest"));
router.use("/trending", require("./trending"));
router.use("/best", require("./best"));
router.use("/search", require("./search"));
router.use("/details", require("./details"));
router.use("/episode", require("./episode"));
router.get("/scrap", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const scraper = new Scrapper(url);
    const playerData = await scraper.getEpisodePlayer();

    res.json({ message: 'Data fetched successfully', url: url, playerData: playerData });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
