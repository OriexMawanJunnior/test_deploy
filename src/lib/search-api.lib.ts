export type GoogleSearchOptions = {
  query: string;
  num?: number;
}

export type BingSearchOptions = {
  query: string;
  count?: number;
  offset?: number;
}

export type PerplexitySearchOptions = {
  query: string;
  max_tokens?: number;
}

export type YouSearchOptions = {
  query: string;
  num_web_results?: number;
}

export type ExaSearchOptions = {
  query: string;
  numResults?: number;
}

export type GensparkSearchOptions = {
  query: string;
}

export const searchWithGoogle = async (config: { api_key: string }, options: GoogleSearchOptions) => {
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${config.api_key}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent(options.query)}&num=${options.num || 10}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.statusText}`);
  }

  return await response.json();
}

export const searchWithBing = async (config: { api_key: string }, options: BingSearchOptions) => {
  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(options.query)}&count=${options.count || 10}&offset=${options.offset || 0}`,
    {
      method: "GET", 
      headers: {
        "Ocp-Apim-Subscription-Key": config.api_key,
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Bing Search API error: ${response.statusText}`);
  }

  return await response.json();
}

export const searchWithPerplexity = async (config: { api_key: string }, options: PerplexitySearchOptions) => {
  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        "messages": [
          {
            "role": "system",
            "content": "Be precise and concise."
          },
          {
            "role": "user",
            "content": options.query
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  return await response.json();
}

export const searchWithYou = async (config: { api_key: string }, options: YouSearchOptions) => {
  const response = await fetch(
    // "https://api.you.com/search/api/v1/web",
    `https://chat-api.you.com/search?query=${options.query}`,
    {
      method: "GET",
      headers: {
        "X-API-Key": config.api_key,
        "Content-Type": "application/json"
      },
    }
  );

  if (!response.ok) {
    throw new Error(`You.com API error: ${response.statusText}`);
  }

  return await response.json();
}

export const searchWithExa = async (config: { api_key: string }, options: ExaSearchOptions) => {
  const response = await fetch(
    "https://api.exa.ai/search",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: options.query,
        numResults: options.numResults || 10
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Exa API error: ${response.statusText}`);
  }

  return await response.json();
}

export const searchWithGenspark = async (config: { api_key: string }, options: GensparkSearchOptions) => {
  const response = await fetch(
    "https://api.genspark.ai/v1/query",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: options.query,
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Genspark API error: ${response.statusText}`);
  }

  return await response.json();
}
