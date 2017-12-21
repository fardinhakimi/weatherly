const host = 'api.worldweatheronline.com';
const keys = require('./config/keys');
const request = require('request');

module.exports = (app) => {

    app.post('/weather-webhook', (req, res) => {

        // Get the city and date from the request
        let city = req.body.result.parameters['geo-city'];
        // Get the date for the weather forecast (if present)
        let date = '';
        if (req.body.result.parameters['date']) {
            date = req.body.result.parameters['date'];
        }
        // Call the weather API
        getWeatherData(city, date).then((output) => {
            // Return the results of the weather API to Dialogflow
            res.setHeader('Content-Type', 'application/json');
            res.send({ 'speech': output, 'displayText': output });
        }).catch((error) => {
            // If there is an error let the user know
            res.setHeader('Content-Type', 'application/json');
            res.send({ 'speech': error, 'displayText': error });
        });
    });

    const getWeatherData = (city, date) => {

        return new Promise((resolve, reject) => {

            // use request to get the weather data
            request({
                "uri": `${host}/premium/v1/weather.ashx?format=json`,
                "qs": {
                    "key": keys.WORLD_WEATHER_KEY,
                    "q": encodeURIComponent(city),
                    "num_of_days": 1,
                    "date": date
                }

            }, (err, res, body) => {

                if (err) {
                    reject(error);
                } else {
                    // After all the data has been received parse the JSON for desired data
                    let forecast = body['data']['weather'][0];
                    let location = body['data']['request'][0];
                    let conditions = body['data']['current_condition'][0];
                    let currentConditions = conditions['weatherDesc'][0]['value'];
                    // Create response
                    let output = `Current conditions in the ${location['type']} 
     ${location['query']} are ${currentConditions} with a projected high of
     ${forecast['maxtempC']}°C or ${forecast['maxtempF']}°F and a low of 
     ${forecast['mintempC']}°C or ${forecast['mintempF']}°F on 
     ${forecast['date']}.`;
                    // Resolve the promise with the output text
                    resolve(output);
                }
            });
        });
    }
}