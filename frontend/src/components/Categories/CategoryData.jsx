// Game data organized by category
export const gamesByCategory = {
  memory: [
    {
      key: "number-recall",
      label: "Number Recall",
      desc: "Memorize and repeat sequences of numbers.",
    },
    {
      key: "word-grid",
      label: "Word Grid",
      desc: "Recall which words were in a grid.",
    },
    {
      key: "pattern-playback",
      label: "Pattern Playback",
      desc: "Repeat color patterns that get longer each round.",
    },
    {
      key: "face-name-match",
      label: "Face-Name Match",
      desc: "Match faces with names after a preview.",
    },
    {
      key: "card-flip-memory",
      label: "Card Flip Memory",
      desc: "Flip cards to find matching pairs.",
    },
  ],
  attention: [
    {
      key: "odd-one-out",
      label: "Odd One Out",
      desc: "Click the odd shape/color among a group.",
    },
    {
      key: "focus-shift",
      label: "Focus Shift",
      desc: "Switch tasks quickly (e.g., tap even numbers unless red).",
    },
    {
      key: "distraction-dodger",
      label: "Distraction Dodger",
      desc: "Tap targets but avoid distractors.",
    },
    {
      key: "spot-the-change",
      label: "Spot the Change",
      desc: "Find what's changed between two images.",
    },
    {
      key: "moving-target",
      label: "Moving Target",
      desc: "Track a moving shape and select it after.",
    },
  ],
  speed: [
    {
      key: "quick-match",
      label: "Quick Match",
      desc: "Match symbols or colors as fast as possible.",
    },
    {
      key: "math-blitz",
      label: "Math Blitz",
      desc: "Solve simple equations quickly.",
    },
    {
      key: "speed-sort",
      label: "Speed Sort",
      desc: "Sort falling shapes or words by category.",
    },
    {
      key: "reaction-time-tap",
      label: "Reaction Time Tap",
      desc: "Tap as soon as the screen changes.",
    },
    {
      key: "category-storm",
      label: "Category Storm",
      desc: "Name/select items from a category fast.",
    },
  ],
  logic: [
    {
      key: "shape-sequences",
      label: "Shape Sequences",
      desc: "Guess the next shape in a sequence.",
    },
    {
      key: "math-logic",
      label: "Math Logic",
      desc: "Puzzles with missing operators or values.",
    },
    {
      key: "tile-puzzle",
      label: "Tile Puzzle",
      desc: "Slide tiles to complete an image or pattern.",
    },
    {
      key: "symbol-equation",
      label: "Symbol Equation",
      desc: "Solve equations with hidden symbol values.",
    },
    {
      key: "path-builder",
      label: "Path Builder",
      desc: "Connect points following logic rules.",
    },
  ],
  language: [
    {
      key: "word-ladder",
      label: "Word Ladder",
      desc: "Change one letter at a time to reach a new word.",
    },
    {
      key: "anagram-rush",
      label: "Anagram Rush",
      desc: "Rearrange letters to make as many words as possible.",
    },
    {
      key: "synonym-match",
      label: "Synonym Match",
      desc: "Match words with similar meanings.",
    },
    {
      key: "missing-letter",
      label: "Missing Letter",
      desc: "Fill in the blank in a word.",
    },
    {
      key: "grammar-fix",
      label: "Grammar Fix",
      desc: "Spot the grammatical error in a sentence.",
    },
  ],
  multi: [
    {
      key: "dual-tasking",
      label: "Dual Tasking",
      desc: "Respond to auditory and visual cues at the same time.",
    },
    {
      key: "navigation-challenge",
      label: "Navigation Challenge",
      desc: "Remember a map and navigate through it.",
    },
    {
      key: "resource-management",
      label: "Resource Management",
      desc: "Track multiple things under pressure.",
    },
    {
      key: "color-word-switch",
      label: "Color-Word Switch",
      desc: "Select the font color, not the word.",
    },
    {
      key: "rapid-decision",
      label: "Rapid Decision",
      desc: "Combine math, logic, and focus for quick decisions.",
    },
  ],
  competitive: [
    {
      key: "brain-battle",
      label: "Brain Battle",
      desc: "Compete live in 3 random mini-games.",
    },
    {
      key: "memory-maze",
      label: "Memory Maze",
      desc: "Navigate a maze that's shown once and disappears.",
    },
    {
      key: "speed-duel",
      label: "Speed Duel",
      desc: "Two players race to complete the same task.",
    },
    {
      key: "cognitive-combo",
      label: "Cognitive Combo",
      desc: "A long challenge mixing 4-5 types.",
    },
    {
      key: "iq-arena",
      label: "IQ Arena",
      desc: "Weekly rotating puzzle tournaments.",
    },
  ],
};

// Category descriptions
export const categoryDescriptions = {
  memory:
    "Memory games challenge your ability to store, retain, and recall information.",
  attention:
    "Attention games help you improve your focus and ignore distractions.",
  speed:
    "Speed games test and improve your reaction time and processing speed.",
  logic: "Logic games develop your reasoning and problem-solving skills.",
  language: "Language games enhance your vocabulary and verbal reasoning.",
  multi: "Multi-domain games combine several cognitive skills at once.",
  competitive:
    "Competitive games are multiplayer challenges where you compete against other players.",
};

// Category metadata for enhanced UI
export const categoryEnhancements = {
  memory: {
    icon: "/src/components/Categories/Icons/Memory.png",
    desc: "Train your memory and recall abilities",
    science: "Strengthen neural pathways for better retention",
    color: "var(--memory-main, #5b9bd5)",
    lightColor: "var(--memory-light, rgba(91, 155, 213, 0.2))",
  },
  attention: {
    icon: "/src/components/Categories/Icons/Attention.png",
    desc: "Improve focus and selective attention",
    science: "Enhance attention networks in the brain",
    color: "var(--attention-main, #ed7d31)",
    lightColor: "var(--attention-light, rgba(237, 125, 49, 0.2))",
  },
  speed: {
    icon: "/src/components/Categories/Icons/Speed.png",
    desc: "Boost reaction time and processing speed",
    science: "Optimize cognitive processing efficiency",
    color: "var(--speed-main, #70ad47)",
    lightColor: "var(--speed-light, rgba(112, 173, 71, 0.2))",
  },
  logic: {
    icon: "/src/components/Categories/Icons/Logic.png",
    desc: "Develop reasoning and problem-solving",
    science: "Strengthen executive function networks",
    color: "var(--logic-main, #7030a0)",
    lightColor: "var(--logic-light, rgba(112, 48, 160, 0.2))",
  },
  language: {
    icon: "/src/components/Categories/Icons/Language.png",
    desc: "Enhance verbal and linguistic abilities",
    science: "Activate language processing centers",
    color: "var(--language-main, #ffc000)",
    lightColor: "var(--language-light, rgba(255, 192, 0, 0.2))",
  },
  multi: {
    icon: "/src/components/Categories/Icons/Multi.png",
    desc: "Master multitasking and cognitive flexibility",
    science: "Integrate multiple brain networks",
    color: "var(--multi-main, #4472c4)",
    lightColor: "var(--multi-light, rgba(68, 114, 196, 0.2))",
  },
  competitive: {
    icon: "/src/components/Categories/Icons/Competetive.png",
    desc: "Challenge yourself with multiplayer competitions",
    science: "Push cognitive limits against real opponents",
    color: "var(--competitive-main, #ff6666)",
    lightColor: "var(--competitive-light, rgba(255, 102, 102, 0.2))",
  },
};

// Helper function to get all data for a category
export function getEnhancedCategory(category) {
  if (!category || !category.key) return null;

  return {
    ...category,
    ...categoryEnhancements[category.key],
    games: gamesByCategory[category.key] || [],
  };
}

// Helper function to enhance a list of categories with metadata
export function enhanceCategories(categories = []) {
  return categories.map(getEnhancedCategory);
}

// Helper function to get game label from key
export function getGameLabel(catKey, gameKey) {
  const games = gamesByCategory[catKey];
  const game = games?.find((g) => g.key === gameKey);
  return game?.label || gameKey;
}

// Default export for easier importing
export default {
  gamesByCategory,
  categoryDescriptions,
  categoryEnhancements,
  getEnhancedCategory,
  enhanceCategories,
  getGameLabel,
};
