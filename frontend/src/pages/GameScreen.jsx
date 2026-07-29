import { useParams } from "react-router-dom";

// Memory
import NumberRecall from "../components/Games/Memory/NumberRecall.jsx";
import WordGrid from "../components/Games/Memory/WordGrid.jsx";
import PatternPlayback from "../components/Games/Memory/PatternPlayback.jsx";
import FaceNameMatch from "../components/Games/Memory/FaceNameMatch.jsx";
import CardFlipMemory from "../components/Games/Memory/CardFlipMemory.jsx";

// Attention
import OddOneOut from "../components/Games/Attention/OddOneOut.jsx";
import FocusShift from "../components/Games/Attention/FocusShift.jsx";
import DistractionDodger from "../components/Games/Attention/DistractionDodger.jsx";
import SpotTheChange from "../components/Games/Attention/SpotTheChange.jsx";
import MovingTarget from "../components/Games/Attention/MovingTarget.jsx";

// Speed
import QuickMatch from "../components/Games/Speed/QuickMatch.jsx";
import MathBlitz from "../components/Games/Speed/MathBlitz.jsx";
import SpeedSort from "../components/Games/Speed/SpeedSort.jsx";
import ReactionTimeTap from "../components/Games/Speed/ReactionTimeTap.jsx";
import CategoryStorm from "../components/Games/Speed/CategoryStorm.jsx";

// Logic
import ShapeSequences from "../components/Games/Logic/ShapeSequences.jsx";
import MathLogic from "../components/Games/Logic/MathLogic.jsx";
import TilePuzzle from "../components/Games/Logic/TilePuzzle.jsx";
import SymbolEquation from "../components/Games/Logic/SymbolEquation.jsx";
import PathBuilder from "../components/Games/Logic/PathBuilder.jsx";

// Language
import WordLadder from "../components/Games/Language/WordLadder.jsx";
import AnagramRush from "../components/Games/Language/AnagramRush.jsx";
import SynonymMatch from "../components/Games/Language/SynonymMatch.jsx";
import MissingLetter from "../components/Games/Language/MissingLetter.jsx";
import GrammarFix from "../components/Games/Language/GrammarFix.jsx";

// import DualTasking from "../components/Games/Multi/DualTasking.jsx";
// import NavigationChallenge from "../components/Games/Multi/NavigationChallenge.jsx";
// import ResourceManagement from "../components/Games/Multi/ResourceManagement.jsx";
// import ColorWordSwitch from "../components/Games/Multi/ColorWordSwitch.jsx";
// import RapidDecision from "../components/Games/Multi/RapidDecision.jsx";

// import BrainBattle from "../components/Games/Advanced/BrainBattle.jsx";
// import MemoryMaze from "../components/Games/Advanced/MemoryMaze.jsx";
// import SpeedDuel from "../components/Games/Advanced/SpeedDuel.jsx";
// import CognitiveCombo from "../components/Games/Advanced/CognitiveCombo.jsx";
// import IQArena from "../components/Games/Advanced/IQArena.jsx";

// Map keys to components
const gameComponents = {
  // Memory
  "number-recall": NumberRecall,
  "word-grid": WordGrid,
  "pattern-playback": PatternPlayback,
  "face-name-match": FaceNameMatch,
  "card-flip-memory": CardFlipMemory,
  // Attention
  "odd-one-out": OddOneOut,
  "focus-shift": FocusShift,
  "distraction-dodger": DistractionDodger,
  "spot-the-change": SpotTheChange,
  "moving-target": MovingTarget,
  // Speed
  "quick-match": QuickMatch,
  "math-blitz": MathBlitz,
  "speed-sort": SpeedSort,
  "reaction-time-tap": ReactionTimeTap,
  "category-storm": CategoryStorm,
  // Logic
  "shape-sequences": ShapeSequences,
  "math-logic": MathLogic,
  "tile-puzzle": TilePuzzle,
  "symbol-equation": SymbolEquation,
  "path-builder": PathBuilder,
  // Language
  "word-ladder": WordLadder,
  "anagram-rush": AnagramRush,
  "synonym-match": SynonymMatch,
  "missing-letter": MissingLetter,
  "grammar-fix": GrammarFix,
  // // Multi-domain
  // "dual-tasking": DualTasking,
  // "navigation-challenge": NavigationChallenge,
  // "resource-management": ResourceManagement,
  // "color-word-switch": ColorWordSwitch,
  // "rapid-decision": RapidDecision,
  // // Advanced
  // "brain-battle": BrainBattle,
  // "memory-maze": MemoryMaze,
  // "speed-duel": SpeedDuel,
  // "cognitive-combo": CognitiveCombo,
  // "iq-arena": IQArena,
};

export default function GameScreen({ token }) {
  const { game } = useParams();
  const Comp = gameComponents[game];
  return (
    <div style={{ margin: 0, padding: 0 }}>
      {Comp ? (
        <Comp token={token} />
      ) : (
        <div className="alert alert-danger">Game not found.</div>
      )}
    </div>
  );
}
