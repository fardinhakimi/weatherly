const getTemperatureMapping = (averageTemp) => {

    if (averageTemp <= -30) {
        return "extremely cold or freezing!"
    } else if (averageTemp < 0 && averageTemp >= -10) {
        return "ice cold"
    } else if (averageTemp >= 0 && averageTemp < 15) {
        return "cold"
    } else if (averageTemp >= 15 && averageTemp < 20) {
        return "slightly cold"
    } else if (averageTemp >= 20 && averageTemp < 25) {
        return "warm"
    } else if (averageTemp >= 25 && averageTemp < 30) {
        return "warm to hot"
    } else if (averageTemp >= 30 && averageTemp < 37) {
        return "hot"
    } else if (averageTemp >= 37 && averageTemp < 40) {
        return "very hot"
    } else if (averageTemp >= 40 && averageTemp < 50) {
        return "extremely hot"
    } else if (averageTemp >= 50 && averageTemp <= 60) {
        return "Extremely hot and uninhabitable"
    }
}


module.exports = {
    getTemperatureMapping
}