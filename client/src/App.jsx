import { CloudSun, Droplets, LocateFixed, MapPin, Search, ThermometerSun, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getRecentSearches, getWeather } from "./api";
import { mapWeatherIcon } from "./weatherIcons";

const defaultCity = "Hyderabad";

function formatDay(value) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat">
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ForecastCard({ item }) {
  const weather = item.weather?.[0] || {};
  const icon = mapWeatherIcon(weather.icon);

  return (
    <article className="forecast-card">
      <div>
        <p>{formatDay(item.dt_txt)}</p>
        <strong>{Math.round(item.main.temp)} deg C</strong>
      </div>
      <img src={icon.url} alt={icon.label} />
      <span>{weather.description}</span>
    </article>
  );
}

export default function App() {
  const [city, setCity] = useState(defaultCity);
  const [weatherData, setWeatherData] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const current = weatherData?.current;
  const currentWeather = current?.weather?.[0];
  const currentIcon = useMemo(
    () => (currentWeather?.icon ? mapWeatherIcon(currentWeather.icon) : null),
    [currentWeather?.icon]
  );

  async function loadWeather(query) {
    setStatus("loading");
    setError("");

    try {
      const data = await getWeather(query);
      setWeatherData(data);
      setCity(data.current?.name || city);
      setStatus("ready");
      setRecentSearches(await getRecentSearches());
    } catch (loadError) {
      setError(loadError.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadWeather({ city: defaultCity });
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const nextCity = city.trim();

    if (nextCity) {
      loadWeather({ city: nextCity });
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeather({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => {
        setError("Location permission was not granted.");
        setStatus("error");
      }
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard">
        <header className="topbar">
          <div>
            <span className="eyebrow">OpenWeather MERN dashboard</span>
            <h1>Weather Forecast</h1>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Search city"
                aria-label="Search city"
              />
            </label>
            <button type="submit" title="Search weather" aria-label="Search weather">
              <Search size={18} />
            </button>
            <button type="button" onClick={handleUseLocation} title="Use my location" aria-label="Use my location">
              <LocateFixed size={18} />
            </button>
          </form>
        </header>

        {status === "error" && <div className="notice">{error}</div>}
        {status === "loading" && <div className="notice">Loading weather data...</div>}

        {current && (
          <>
            <section className="current-panel">
              <div className="current-main">
                <div className="place">
                  <MapPin size={20} aria-hidden="true" />
                  <span>
                    {current.name}, {current.sys?.country}
                  </span>
                </div>
                <div className="temperature">{Math.round(current.main.temp)} deg C</div>
                <p>{currentWeather?.description}</p>
              </div>

              {currentIcon && (
                <div className="weather-visual">
                  <img src={currentIcon.url} alt={currentIcon.label} />
                  <span>{currentIcon.label}</span>
                </div>
              )}
            </section>

            <section className="stats-grid" aria-label="Weather details">
              <Stat icon={ThermometerSun} label="Feels like" value={`${Math.round(current.main.feels_like)} deg C`} />
              <Stat icon={Droplets} label="Humidity" value={`${current.main.humidity}%`} />
              <Stat icon={Wind} label="Wind" value={`${Math.round(current.wind.speed)} m/s`} />
              <Stat icon={CloudSun} label="Clouds" value={`${current.clouds.all}%`} />
            </section>

            <section className="forecast-section">
              <div className="section-heading">
                <h2>5-Day Forecast</h2>
                <span>Midday readings</span>
              </div>
              <div className="forecast-grid">
                {weatherData.forecast.list.map((item) => (
                  <ForecastCard key={item.dt} item={item} />
                ))}
              </div>
            </section>

            <aside className="recent-section">
              <div className="section-heading">
                <h2>Recent Searches</h2>
                <span>Saved in MongoDB</span>
              </div>
              <div className="recent-list">
                {recentSearches.length === 0 && <span>No recent searches yet.</span>}
                {recentSearches.map((item) => (
                  <button key={item._id} type="button" onClick={() => loadWeather({ city: item.city })}>
                    {item.city}
                    {item.country ? `, ${item.country}` : ""}
                  </button>
                ))}
              </div>
            </aside>
          </>
        )}
      </section>
    </main>
  );
}
