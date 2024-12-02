const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const router = require('./routes'); 

const PORT = process.env.PORT || 3090;
const app = express();

app.use(helmet());  
app.use(morgan('tiny'));
app.use(compression()); 
app.use(cors()); 

app.use('/', router); 

app.listen(PORT, () => {
    console.log(`YugenAnime Scraper by Rem running on port ${PORT}`);
});
