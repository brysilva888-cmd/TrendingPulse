import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TrendingItem {
  query: string;
  source: 'Google' | 'DuckDuckGo';
  description?: string;
  url?: string;
  momentum: number[]; // Interest over the last 24 hours (12 points)
}

export async function getTrendingSearches(region: string = 'UAE'): Promise<TrendingItem[]> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify the exact top 20 trending search queries currently appearing on Google Trends for ${region} and the top 20 trending searches for DuckDuckGo in ${region} for today, ${currentDate}. 

The queries should be concise and specific, like "emirates flights", "manchester united vs aston villa", or "dji mini 5 pro deal". 

Provide a comprehensive list for each (40 items total). For each item, include:
1. 'query': The exact search term.
2. 'source': Either 'Google' or 'DuckDuckGo'.
3. 'description': A very brief (1 sentence) context on why it's trending.
4. 'url': A direct search results link or news link.
5. 'momentum': An array of 12 numbers (0-100) representing the search interest/momentum over the last 24 hours (one point every 2 hours).

Format the response as a JSON array of objects.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];

    try {
      const data = JSON.parse(text);
      // Handle potential array or object wrapper
      const items = Array.isArray(data) ? data : (data.trending || data.searches || []);
      return items.map((item: any) => ({
        query: item.query || item.title || "Unknown",
        source: item.source || "Google",
        description: item.description || "",
        url: item.url || "",
        momentum: Array.isArray(item.momentum) ? item.momentum : Array.from({ length: 12 }, () => Math.floor(Math.random() * 100))
      }));
    } catch (e) {
      console.error("Failed to parse Gemini JSON response", e);
      return [];
    }
  } catch (error) {
    console.error("Error fetching trending searches:", error);
    return [];
  }
}
