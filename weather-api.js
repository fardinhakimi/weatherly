const host = 'https://api.worldweatheronline.com/premium/v1/weather.ashx';
const keys = require('./config/keys');
const request = require('request');
const moment = require('moment');
const service = require('./services/service');

module.exports = (app) => {

    app.post('/weather-webhook', (req, res) => {

        console.log(`request object: ${req}`);

        // Get the city and date from the request
        let city = '',
            temperature = '',
            date = '',
            weatherCondition = '';

        // Get the city (if present)
        if (req.body.result.parameters['geo-city']) {
            city = req.body.result.parameters['geo-city'];
        }
        // Get the date for the weather forecast (if present)
        if (req.body.result.parameters['date']) {
            date = req.body.result.parameters['date'];
        }
        // Get the temperature (if present)
        if (req.body.result.parameters['temperature']) {
            temperature = req.body.result.parameters['temperature'];
        }
        // Get the temperature (if present)
        if (req.body.result.parameters['weather-condition']) {
            weatherCondition = req.body.result.parameters['weather-condition'];
        }

        // get weather data
        getWeatherData(city, date, temperature, weatherCondition).then((output) => {
            console.log(output);
            // Return the results of the weather API to Dialogflow
            res.setHeader('Content-Type', 'application/json');
            res.send({ 'speech': output, 'displayText': output });
        }).catch((error) => {
            console.log(error);
            // If there is an error let the user know
            res.setHeader('Content-Type', 'application/json');
            res.send({ 'speech': error, 'displayText': error });
        });
    });

    const getWeatherData = (city, date, temperature, weatherCondition) => {
        // if the date is today or null
        let today = new Date();
        let newDate = new Date(date);

        if (temperature != '' && city != '') {
            return getTemperaterWeatherData(city, date, temperature);
        }

        if (weatherCondition != '' && city != '') {
            return getConditionWeatherData(city, date, weatherCondition);
        }

        if (today.toDateString() === newDate.toDateString() || date === '') {
            console.log("current weather data");
            return getCurrentWeatherData(city, date);

        } else if (date != '' && newDate > today) {
            console.log("future weather data");
            let numOfDays = moment(newDate).diff(moment(today), "days") + 1;
            return getForcastWeatherData(city, date, numOfDays);
        } else if (date != '' && newDate < today) {
            console.log("past weather data");
            let numOfDays = moment(today).diff(moment(newDate), "days") + 1;
            //pastWeatherData(city, date, numOfDays);
        }
    }

    const callWeatherAPI = (city, date, numOfDays, callback) => {

        // use request to get the weather data
        request({
            "uri": `${host}/premium/v1/weather.ashx?format=json`,
            "qs": {
                "key": keys.WORLD_WEATHER_KEY,
                "q": encodeURIComponent(city),
                "num_of_days": numOfDays,
                "date": date
            }

        }, (err, res, body) => {

            if (!err) {
                // After all the data has been received parse the JSON for desired data
                let response = JSON.parse(body);

                let conditions = response['data']['current_condition'][0];

                let parsedReponse = {
                    "forecast": response['data']['weather'][0],
                    "location": response['data']['request'][0],
                    "conditions": conditions,
                    "currentConditions": conditions['weatherDesc'][0]['value']
                }

                callback(undefined, parsedReponse);
            } else {
                callback(err, undefined);
            }
        });
    }

    const getCurrentWeatherData = (city, date) => {
        return new Promise((resolve, reject) => {
            callWeatherAPI(city, date, 1, (err, result) => {
                if (!err) {
                    // Create response
                    let output = `Current conditions in the ${result['location']['type']} 
                         ${result['location']['query']} are ${result['currentConditions']} with a projected high of
                         ${result['forecast']['maxtempC']}°C or ${result['forecast']['maxtempF']}°F and a low of 
                         ${result['forecast']['mintempC']}°C or ${result['forecast']['mintempF']}°F on 
                         ${result['forecast']['date']}.`;
                    // Resolve the promise with the output text
                    resolve(output);
                } else {
                    reject(err);
                }
            });
        });
    }

    const getForcastWeatherData = (city, date, numOfDays) => {
        return new Promise((resolve, reject) => {
            callWeatherAPI(city, date, numOfDays, (err, result) => {
                if (!err) {
                    // Create response
                    let output = `The forecast for ${result['location']['type']} ${result['location']['query']} are
                ${result['currentConditions']} with a projected high of
                ${result['forecast']['maxtempC']}°C or ${result['forecast']['maxtempF']}°F and a low of 
                ${result['forecast']['mintempC']}°C or ${result['forecast']['mintempF']}°F on 
                ${result['forecast']['date']}.`;
                    // Resolve the promise with the output text
                    resolve(output);
                } else {
                    reject(err);
                }
            });
        });
    }

    const getTemperaterWeatherData = (city, date, temperature) => {

        return new Promise((resolve, reject) => {
            callWeatherAPI(city, date, 1, (err, result) => {
                if (!err) {
                    // Create response
                    let averageTemp = ((parseInt(result['forecast']['maxtempC'])) + (parseInt(result['forecast']['mintempC']))) / 2;
                    let currentTempCondition = service.getTemperatureMapping(Math.ceil(averageTemp));
                    let output = `The weather stats for ${result['location']['type']} ${result['location']['query']} are:
                     Maxium temperature:  ${result['forecast']['maxtempC']}°C   or ${result['forecast']['mintempF']}°F 
                     Minimum temperature: ${result['forecast']['mintempC']}°C  or ${result['forecast']['maxtempF']}°F 
                     and an Average temperature of ${Math.ceil(averageTemp)}°C  on 
                    ${result['forecast']['date']} which is considered to be ${currentTempCondition}`;
                    // Resolve the promise with the output text
                    resolve(output);
                } else {
                    reject(err);
                }
            });
        });
    }


    const getConditionWeatherData = (city, date, temperature) => {

        return new Promise((resolve, reject) => {
            callWeatherAPI(city, date, 1, (err, result) => {
                if (!err) {
                    // Create response
                    let output = `It is ${result['currentConditions']} in ${result['location']['type']} ${result['location']['query']} with a projected high of
                    ${result['forecast']['maxtempC']}°C or ${result['forecast']['maxtempF']}°F and a low of 
                    ${result['forecast']['mintempC']}°C or ${result['forecast']['mintempF']}°F on 
                    ${result['forecast']['date']}.`;
                    // Resolve the promise with the output text
                    resolve(output);
                } else {
                    reject(err);
                }
            });
        });
    }


    const pastWeatherData = () => {

    }
}