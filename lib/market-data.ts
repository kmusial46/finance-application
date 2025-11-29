const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_QUOTE_ENDPOINT = `${FINNHUB_BASE_URL}/quote`;
const FINNHUB_SEARCH_ENDPOINT = `${FINNHUB_BASE_URL}/search`;
const FINNHUB_PROFILE_ENDPOINT = `${FINNHUB_BASE_URL}/stock/profile2`;
const FINNHUB_CANDLE_ENDPOINT = `${FINNHUB_BASE_URL}/stock/candle`;
const FINNHUB_METRIC_ENDPOINT = `${FINNHUB_BASE_URL}/stock/metric`;

const API_ERROR = "Unable to reach market data provider.";

const getApiKey = () => {
  // Prefer a server-side key (not exposed to the client). Fall back to the
  // public env var only if the server key is not set. This makes local dev
  // easier and allows secure server-only configuration.
  // Support a few common env names used across this repo and by providers
  // (e.g. FINNHUB). This makes local setups more forgiving if the key was
  // named differently in `.env`.
  const key =
    process.env.MARKET_DATA_API_KEY ||
    process.env.NEXT_PUBLIC_MARKET_DATA_API_KEY ||
    process.env.NEXT_PUBLIC_FINNHUB_API_KEY ||
    process.env.FINNHUB_API_KEY;

  if (!key) {
    throw new Error(
      "Missing market data API key. Set one of: MARKET_DATA_API_KEY, NEXT_PUBLIC_MARKET_DATA_API_KEY, NEXT_PUBLIC_FINNHUB_API_KEY, or FINNHUB_API_KEY."
    );
  }
  return key;
};

const callFinnhub = async (endpoint: string, params: Record<string, string>) => {
  const url = new URL(endpoint);
  const apiKey = getApiKey();

  Object.entries({ ...params, token: apiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${API_ERROR} (status: ${response.status})`);
  }

  return response.json();
};

export const fetchQuoteForSymbol = async (symbol: string) => {
  const data = await callFinnhub(FINNHUB_QUOTE_ENDPOINT, { symbol });

  if (!data || typeof data.c !== "number" || data.c <= 0) {
    // Return a fallback or throw. For now, let's return null to handle gracefully.
    // throw new Error(`No valid quote returned for symbol ${symbol}.`);
    return null;
  }

  return {
    price: data.c as number,
    open: typeof data.o === "number" ? data.o : undefined,
    high: typeof data.h === "number" ? data.h : undefined,
    low: typeof data.l === "number" ? data.l : undefined,
    previousClose: typeof data.pc === "number" ? data.pc : undefined,
  };
};

export const searchSymbol = async (query: string) => {
  const data = await callFinnhub(FINNHUB_SEARCH_ENDPOINT, { q: query });

  if (!data || !Array.isArray(data.result)) {
    return null;
  }

  const [primary] = data.result.filter((item: any) => Boolean(item?.symbol));

  if (!primary) {
    return null;
  }

  return {
    symbol: String(primary.symbol),
    name: typeof primary.description === "string" ? primary.description : undefined,
  };
};

export const fetchCompanyProfile = async (symbol: string) => {
  const data = await callFinnhub(FINNHUB_PROFILE_ENDPOINT, { symbol });

  if (!data || typeof data.name !== "string") {
    return null;
  }

  return {
    name: data.name as string,
    ticker: typeof data.ticker === "string" ? data.ticker : symbol,
    exchange: typeof data.exchange === "string" ? data.exchange : undefined,
    currency: typeof data.currency === "string" ? data.currency : undefined,
    logo: typeof data.logo === "string" ? data.logo : undefined,
  };
};

export const fetchCandles = async (symbol: string, resolution: string, from: number, to: number) => {
  const data = await callFinnhub(FINNHUB_CANDLE_ENDPOINT, {
    symbol,
    resolution,
    from: String(from),
    to: String(to),
  });

  if (data.s === "no_data") {
    return null;
  }

  return data as FinnhubCandle;
};

export const fetchMetric = async (symbol: string) => {
  const data = await callFinnhub(FINNHUB_METRIC_ENDPOINT, { symbol, metric: "all" });
  return data as FinnhubMetric;
};
