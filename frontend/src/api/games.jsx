import { API_BASE } from "./config.js";
import { categoryEnhancements } from "../components/Categories/CategoryData.jsx";

const BASE_URL = `${API_BASE}/games/`;

// MEMORY GAMES
export async function submitNumberRecall(data, token) {
  console.log("=== submitNumberRecall: Sending data:", data);
  console.log("=== submitNumberRecall: Token:", token ? "Present" : "Missing");

  try {
    const res = await fetch(`${BASE_URL}number-recall/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    console.log("=== submitNumberRecall: Response status:", res.status);
    console.log(
      "=== submitNumberRecall: Response headers:",
      Object.fromEntries(res.headers)
    );

    const responseData = await res.json();
    console.log("=== submitNumberRecall: Response data:", responseData);

    if (!res.ok) {
      console.error("=== submitNumberRecall: Request failed:", responseData);
    }

    return responseData;
  } catch (error) {
    console.error("=== submitNumberRecall: Network error:", error);
    throw error;
  }
}

export async function submitWordGrid(data, token) {
  const res = await fetch(`${BASE_URL}word-grid/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitPatternPlayback(data, token) {
  const res = await fetch(`${BASE_URL}pattern-playback/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitFaceNameMatch(data, token) {
  const res = await fetch(`${BASE_URL}face-name-match/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitCardFlipMemory(data, token) {
  const res = await fetch(`${BASE_URL}card-flip-memory/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ATTENTION GAMES
export async function submitOddOneOut(data, token) {
  const res = await fetch(`${BASE_URL}odd-one-out/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitFocusShift(data, token) {
  const res = await fetch(`${BASE_URL}focus-shift/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitDistractionDodger(data, token) {
  const res = await fetch(`${BASE_URL}distraction-dodger/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitSpotTheChange(data, token) {
  const res = await fetch(`${BASE_URL}spot-the-change/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// SPEED GAMES
export async function submitQuickMatch(data, token) {
  const res = await fetch(`${BASE_URL}quick-match/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitMathBlitz(data, token) {
  const res = await fetch(`${BASE_URL}math-blitz/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitSpeedSort(data, token) {
  const res = await fetch(`${BASE_URL}speed-sort/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitReactionTimeTap(data, token) {
  const res = await fetch(`${BASE_URL}reaction-time-tap/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitCategoryStorm(data, token) {
  const res = await fetch(`${BASE_URL}category-storm/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitReactionTime(data, token) {
  const res = await fetch(`${BASE_URL}reaction-time/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// LOGIC GAMES
export async function submitShapeSequences(data, token) {
  const res = await fetch(`${BASE_URL}shape-sequences/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitMathLogic(data, token) {
  const res = await fetch(`${BASE_URL}math-logic/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitTilePuzzle(data, token) {
  const res = await fetch(`${BASE_URL}tile-puzzle/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitSymbolEquation(data, token) {
  const res = await fetch(`${BASE_URL}symbol-equation/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitPathBuilder(data, token) {
  const res = await fetch(`${BASE_URL}path-builder/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// LANGUAGE GAMES
export async function submitWordLadder(data, token) {
  const res = await fetch(`${BASE_URL}word-ladder/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitAnagramRush(data, token) {
  const res = await fetch(`${BASE_URL}anagram-rush/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitSynonymMatch(data, token) {
  const res = await fetch(`${BASE_URL}synonym-match/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitMissingLetter(data, token) {
  const res = await fetch(`${BASE_URL}missing-letter/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitGrammarFix(data, token) {
  const res = await fetch(`${BASE_URL}grammar-fix/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// MULTI-DOMAIN GAMES
export async function submitDualTasking(data, token) {
  const res = await fetch(`${BASE_URL}dual-tasking/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitNavigationChallenge(data, token) {
  const res = await fetch(`${BASE_URL}navigation-challenge/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitResourceManagement(data, token) {
  const res = await fetch(`${BASE_URL}resource-management/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitColorWordSwitch(data, token) {
  const res = await fetch(`${BASE_URL}color-word-switch/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitRapidDecision(data, token) {
  const res = await fetch(`${BASE_URL}rapid-decision/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitMovingTarget(data, token) {
  const res = await fetch(`${BASE_URL}moving-target/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitBrainBattle(data, token) {
  const res = await fetch(`${BASE_URL}brain-battle/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitMemoryMaze(data, token) {
  const res = await fetch(`${BASE_URL}memory-maze/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitSpeedDuel(data, token) {
  const res = await fetch(`${BASE_URL}speed-duel/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitCognitiveCombo(data, token) {
  const res = await fetch(`${BASE_URL}cognitive-combo/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitIQArena(data, token) {
  const res = await fetch(`${BASE_URL}iq-arena/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Games API service for category and game information
export const gamesAPI = {
  // Get category information with colors and icons from CategoryData.jsx
  getCategoryInfo: (categoryKey) => {
    const categoryData = categoryEnhancements[categoryKey];
    if (!categoryData) {
      return {
        name: "Unknown",
        icon: "❓",
        color: "#95A5A6",
      };
    }

    // Convert icon path to emoji for now, or you can use the image path
    const iconMap = {
      memory: "🧠",
      attention: "🎯",
      speed: "⚡",
      logic: "🧩",
      language: "📚",
      multi: "🔀",
      competitive: "🏆",
    };

    return {
      name:
        categoryKey === "competitive"
          ? "Competitive"
          : categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
      icon: iconMap[categoryKey] || "❓",
      color: categoryData.color || "#95A5A6",
    };
  },

  // Get all available games from backend API
  getAvailableGames: async (token) => {
    try {
      const res = await fetch(`${BASE_URL}available-games/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch games: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Error fetching available games:", error);
      // Fallback to mock data if API fails
      return [
        { id: 1, name: "Number Recall", category: "memory" },
        { id: 2, name: "Word Grid", category: "memory" },
        { id: 3, name: "Pattern Playback", category: "memory" },
        { id: 4, name: "Face Name Match", category: "memory" },
        { id: 5, name: "Card Matching", category: "memory" },
        { id: 6, name: "Spatial Memory", category: "memory" },
        { id: 7, name: "Attention Training", category: "attention" },
        { id: 8, name: "Visual Search", category: "attention" },
        { id: 9, name: "Dual N-Back", category: "attention" },
        { id: 10, name: "Processing Speed", category: "speed" },
        { id: 11, name: "Reaction Time", category: "speed" },
        { id: 12, name: "Logic Puzzles", category: "logic" },
        { id: 13, name: "Pattern Analysis", category: "logic" },
        { id: 14, name: "Vocabulary", category: "language" },
        { id: 15, name: "Reading Comprehension", category: "language" },
        { id: 16, name: "Task Switching", category: "multi" },
        { id: 17, name: "Working Memory", category: "multi" },
        { id: 18, name: "Moving Target", category: "competitive" },
      ];
    }
  },

  // Get games by category
  getGamesByCategory: async (category, token) => {
    const allGames = await gamesAPI.getAvailableGames(token);
    return allGames.filter((game) => game.category === category);
  },

  // Get game by ID
  getGameById: async (gameId, token) => {
    const allGames = await gamesAPI.getAvailableGames(token);
    return allGames.find((game) => game.id === gameId);
  },
};

// Export all functions for easy importing
export default {
  // Memory games
  submitNumberRecall,
  submitWordGrid,
  submitPatternPlayback,
  submitFaceNameMatch,
  submitCardFlipMemory,

  // Attention games
  submitOddOneOut,
  submitFocusShift,
  submitDistractionDodger,
  submitSpotTheChange,

  // Speed games
  submitQuickMatch,
  submitMathBlitz,
  submitSpeedSort,
  submitReactionTimeTap,
  submitCategoryStorm,
  submitReactionTime,

  // Logic games
  submitShapeSequences,
  submitMathLogic,
  submitTilePuzzle,
  submitSymbolEquation,
  submitPathBuilder,

  // Language games
  submitWordLadder,
  submitAnagramRush,
  submitSynonymMatch,
  submitMissingLetter,
  submitGrammarFix,

  // Multi-domain games
  submitDualTasking,
  submitNavigationChallenge,
  submitResourceManagement,
  submitColorWordSwitch,
  submitRapidDecision,

  // Competitive games
  submitMovingTarget,
  submitBrainBattle,
  submitMemoryMaze,
  submitSpeedDuel,
  submitCognitiveCombo,
  submitIQArena,

  // API service
  gamesAPI,
};
