import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import { Search } from "./models/Search.js";

const app = express();
const PORT = process.env.PORT || 5000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

function requireWeatherKey(_req, res, next) {
  if (!OPENWEATHER_API_KEY) {
    return res.status(500).json({
      message: "OpenWeather API key is missing. Add OPENWEATHER_API_KEY to server/.env."
    });
  }

  next();
}

async function fetchOpenWeather(path, params) {
  const url = new URL(`${OPENWEATHER_BASE_URL}${path}`);
  url.searchParams.set("appid", OPENWEATHER_API_KEY);
  url.searchParams.set("units", "metric");

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || "Unable to fetch weather data.";
    throw new Error(message);
  }

  return data;
}

function normalizeForecast(list = []) {
  const grouped = new Map();

  for (const item of list) {
    const date = item.dt_txt.slice(0, 10);
    const hour = item.dt_txt.slice(11, 13);
    const current = grouped.get(date);

    if (!current || Math.abs(Number(hour) - 12) < Math.abs(Number(current.dt_txt.slice(11, 13)) - 12)) {
      grouped.set(date, item);
    }
  }

  return Array.from(grouped.values()).slice(0, 5);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/weather", requireWeatherKey, async (req, res) => {
  try {
    const { city, lat, lon } = req.query;

    if (!city && (!lat || !lon)) {
      return res.status(400).json({ message: "Provide a city or latitude and longitude." });
    }

    const query = city ? { q: city } : { lat, lon };
    const [current, forecast] = await Promise.all([
      fetchOpenWeather("/weather", query),
      fetchOpenWeather("/forecast", query)
    ]);

    if (city && mongoose.connection.readyState === 1) {
      await Search.create({
        city: current.name,
        country: current.sys?.country || ""
      });
    }

    res.json({
      current,
      forecast: {
        ...forecast,
        list: normalizeForecast(forecast.list)
      }
    });
  } catch (error) {
    res.status(502).json({ message: error.message });
  }
});

app.get("/api/searches", async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json([]);
  }

  const searches = await Search.find().sort({ createdAt: -1 }).limit(8).lean();
  res.json(searches);
});

await connectDb(process.env.MONGO_URI);

app.listen(PORT, () => {
  console.log(`Weather API running on port ${PORT}`);
});
