const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// serve static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('index.html');
});

/* For Facebook Validation */
app.get('/fbwebhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

/* Handling all messages */
app.post('/fbwebhook', (req, res) => {
    console.log(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                    sendMessage(event);
                }
            });
        });
        res.status(200).end();
    }
});



// listen on given port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});