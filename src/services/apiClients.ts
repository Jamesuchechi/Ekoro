let lastMusicBrainzRequestTime = 0;

export async function fetchMusicBrainz(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const query = new URLSearchParams({ ...params, fmt: "json" }).toString();
  const url = `https://musicbrainz.org/ws/2/${endpoint}?${query}`;

  // Enforce MusicBrainz rate limiting (~1 request/sec)
  const now = Date.now();
  const elapsed = now - lastMusicBrainzRequestTime;
  if (elapsed < 1000) {
    const delay = 1000 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastMusicBrainzRequestTime = Date.now();

  const appName = process.env.APP_NAME || "Ekoro";
  const appVersion = process.env.APP_VERSION || "1.0.0";
  const contact = process.env.CONTACT_EMAIL || "okparajamesuchechi@gmail.com";

  const headers = {
    "User-Agent": `${appName}/${appVersion} ( ${contact} )`,
    Accept: "application/json",
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 503) {
      // Throttle/Service Unavailable: retry once after 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchMusicBrainz(endpoint, params);
    }
    throw new Error(`MusicBrainz error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLastFm(
  method: string,
  params: Record<string, string> = {}
): Promise<any> {
  const apiKey = process.env.LAST_FM_API_KEY;
  if (!apiKey) {
    throw new Error("LAST_FM_API_KEY is not defined in the environment");
  }

  const query = new URLSearchParams({
    ...params,
    method,
    api_key: apiKey,
    format: "json",
  }).toString();

  const url = `http://ws.audioscrobbler.com/2.0/?${query}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDiscogs(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const key = process.env.DISCOGS_CONSUMER_KEY;
  const secret = process.env.DISCOGS_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("Discogs API credentials not defined in the environment");
  }

  const query = new URLSearchParams({
    ...params,
    key,
    secret,
  }).toString();

  const url = `https://api.discogs.com/${endpoint}?${query}`;
  const headers = {
    "User-Agent": `${process.env.APP_NAME || "Ekoro"}/${process.env.APP_VERSION || "1.0.0"}`,
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCoverArtArchive(
  mbid: string,
  isReleaseGroup = true
): Promise<any> {
  const type = isReleaseGroup ? "release-group" : "release";
  const url = `https://coverartarchive.org/${type}/${mbid}`;

  const response = await fetch(url);
  if (!response.ok) {
    // Normal case: many tracks or releases don't have cover art
    return null;
  }
  return response.json();
}

export async function fetchLrclib(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const query = new URLSearchParams(params).toString();
  const url = `https://lrclib.net/api/${endpoint}?${query}`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`LRCLIB error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
