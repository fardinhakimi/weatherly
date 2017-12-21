module.exports = (app) => {

    app.get('/test-webhook', (req, res) => {

        response = "This is a sample response from your webhook!" //Default response from the webhook to show it's working
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send({
            "speech": response,
            "displayText": response
        });
    });
}