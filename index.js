const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

// serve static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('index.html');
});

require('./fb-webhook')(app);

// listen on given port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});