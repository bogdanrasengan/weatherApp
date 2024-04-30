const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swaggerConfig"); // Подключение сконфигурированного Swagger
require("dotenv").config();

// quote yr.no "Anything over 20 requests/second per application (total, not per client) requires special agreement."
const limiter = rateLimit({
  windowMs: 1000, // 1 секунда
  max: 20, // ограничение запросов
});

const app = express();
const PORT = process.env.PORT || 3000;
const WEATHER_API_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const RAPID_URL = "https://forward-reverse-geocoding.p.rapidapi.com/v1/search";
const RAPID_API_KEY = process.env.RAPID_API_KEY; //dotenv

app.use(limiter);
app.set("trust proxy", true);
/**
 * @swagger
 * /weather:
 *   get:
 *     summary: Returns the weather for a given coordinates (or for Moscow if no coordinates provided) around 14:00 UTC for max days possible
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: false
 *         description: Latitude of the location
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         required: false
 *         description: Longitude of the location
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimeWeatherData'
 *       400:
 *         description: Error
 *       500:
 *         description: Error
 * components:
 *   schemas:
 *     TimeWeatherData:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           description: UTC timedata
 *         data:
 *           $ref: '#/components/schemas/WeatherData'
 *     WeatherData:
 *       type: object
 *       properties:
 *         air_pressure_at_sea_level:
 *           type: number
 *           description: Air pressure at sea level at the given coordinates
 *         air_temperature:
 *           type: number
 *           description: Air temperature percentage at the given coordinates
 *         cloud_area_fraction:
 *           type: number
 *           description: Cloud area fraction percentage at the given coordinates
 *         relative_humidity:
 *           type: number
 *           description: Relative humidity percentage at the given coordinates
 *         wind_from_direction:
 *           type: number
 *           description: Wind from direction percentage at the given coordinates
 *         wind_speed:
 *           type: number
 *           description: Wind speed percentage at the given coordinates
 */
app.get("/weather", async (req, res) => {
  let { lat, lon } = req.query;
  if (lat && lon && !lat && !lon) {
    res.status(400).json({
      message: `Bad request, used exactly one from {lat, lon}. 
    Need both, or neither for default value (Moscow lat=55.7558, lon=37.6173)`,
    });
  } else {
    if (!lat || !lon) {
      lat = 55.7558;
      lon = 37.6173;
    }
    try {
      const filteredData = await getWeatherByCoordinates(lat, lon);
      res.send(filteredData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching weather data" });
    }
  }
});
/**
 * @swagger
 * /weatherBySearch:
 *   get:
 *     summary: Returns the weather for a search string around 14:00 UTC for max days possible
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search phrase for location
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         required: false
 *         description: langs for specify exotic language, "en, ru" by default
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimeWeatherData'
 *       400:
 *         description: Error
 *       500:
 *         description: Error
 * components:
 *   schemas:
 *     TimeWeatherData:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           description: UTC timedata
 *         data:
 *           $ref: '#/components/schemas/WeatherData'
 *     WeatherData:
 *       type: object
 *       properties:
 *         air_pressure_at_sea_level:
 *           type: number
 *           description: Air pressure at sea level at the given coordinates
 *         air_temperature:
 *           type: number
 *           description: Air temperature percentage at the given coordinates
 *         cloud_area_fraction:
 *           type: number
 *           description: Cloud area fraction percentage at the given coordinates
 *         relative_humidity:
 *           type: number
 *           description: Relative humidity percentage at the given coordinates
 *         wind_from_direction:
 *           type: number
 *           description: Wind from direction percentage at the given coordinates
 *         wind_speed:
 *           type: number
 *           description: Wind speed percentage at the given coordinates
 */
app.get("/weatherBySearch", async (req, res) => {
  let { search, lang } = req.query;
  if (!search) {
    res.status(400).json({ message: "Bad request, search was not provided" });
  } else {
    if (!lang) {
      lang = "en, ru";
    }
    try {
      let [lat, lon] = await getLatLonBySearch(search, lang);
      const filteredData = await getWeatherByCoordinates(lat, lon);
      res.send(filteredData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error searching coordinates" });
    }
  }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function getLatLonBySearch(searchQ, lang) {
  const options = {
    method: "GET",
    url: RAPID_URL,
    params: {
      q: searchQ,
      "accept-language": lang,
      polygon_threshold: "0.0",
    },
    headers: {
      "X-RapidAPI-Key": RAPID_API_KEY,
      "X-RapidAPI-Host": "forward-reverse-geocoding.p.rapidapi.com",
    },
  };
  const response = await axios.request(options);
  return [response.data[0].lat, response.data[0].lon];
}

async function getWeatherByCoordinates(lat, lon) {
  const { data } = await axios.get(WEATHER_API_URL, {
    params: {
      lat: lat, // Широта
      lon: lon, // Долгота
    },
    headers: {
      "User-Agent": "weather-app/1.0",
    },
  });
  return filterWeatherDataFor14(data);
}

function filterWeatherDataFor14(weatherData) {
  const timeseries = weatherData.properties.timeseries;
  // Функция для поиска записи с временем, наиболее близким к 14:00
  const getClosestTo14 = (entries) => {
    const targetHour = 14; // 14:00 часов
    let closestEntry = null;
    let smallestDiff = Infinity;

    entries.forEach(entry => {
      const time = new Date(entry.time);
      const hourDiff = Math.abs(time.getUTCHours() - targetHour);

      if (hourDiff < smallestDiff) {
        smallestDiff = hourDiff;
        closestEntry = entry;
      }
    });

    return closestEntry;
  };

  // Создаем группы по датам
  const groupedByDate = timeseries.reduce((acc, item) => {
    const date = item.time.slice(0, 10); // Извлечь дату в формате 'YYYY-MM-DD'
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Для каждой даты находим наиболее подходящее время
  const results = Object.values(groupedByDate).map(group => getClosestTo14(group));
  // Фильтруем данные для представления только нужных данных и возвращаем
  return results.map((item) => ({
    time: item.time,
    data: item.data.instant.details,
  }));
}
