export async function getWeather(query) {
  const params = new URLSearchParams(query);
  const response = await fetch(`/api/weather?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load weather.");
  }

  return data;
}

export async function getRecentSearches() {
  const response = await fetch("/api/searches");

  if (!response.ok) {
    return [];
  }

  return response.json();
}
