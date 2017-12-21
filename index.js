const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const keys = require('./config/keys');
const app = express();
const dialogFlowApp = require('apiai')(keys.CLIENT_ACCESS_TOKEN);

// serve static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('index.html');
});

/* For Facebook Validation */
app.get('/fbwebhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === keys.FB_RANDOM_STRING) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

// handling messages
app.post('/fbwebhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {
            // Get the webhook event. entry.messaging is an array, but 
            // will only ever contain one event, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // pass the event to the handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

const handleMessage = (sender_psid, received_message) => {
    // Send the response message after 500 milliseconds
    callSendAPI(sender_psid, received_message.text)
}

const callSendAPI = (sender_psid, queryText) => {

    let dialogFlowPromise = dialogFlowApp.textRequest(queryText, {
        sessionId: keys.SESSION_ID // use any arbitrary id
    });

    dialogFlowPromise.on('response', (response) => {
        let aiAgentText = response.result.fulfillment.speech;

        // Send the HTTP request to the Messenger Platform
        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": keys.PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": {
                "recipient": {
                    "id": sender_psid
                },
                "message": { text: aiAgentText }
            }
        }, (err, res, body) => {
            if (!err) {
                console.log('message sent!')
            } else {
                console.error("Unable to send message:" + err);
            }
        });

    });

    dialogFlowPromise.on('error', (error) => {
        console.log(error);
    });

    dialogFlowPromise.end();
}

// require weather api

require('./weather-api')(app);

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});