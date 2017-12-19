const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const keys = require('./config/keys');

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

    let response;

    // Checks if the message contains text
    if (received_message.text) {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        response = {
            "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
        }
    }
    // Send the response message
    callSendAPI(sender_psid, response);
}


const callSendAPI = (sender_psid, response) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": keys.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


// listen on given port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});