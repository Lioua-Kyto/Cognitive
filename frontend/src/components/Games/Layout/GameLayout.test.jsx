import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// GameLayout pulls in audio assets and the sound API; none of that is relevant
// to the prop contract under test.
vi.mock("../../../utils/soundEffects.jsx", () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
  playPause: vi.fn(),
  playResume: vi.fn(),
  playStart: vi.fn(),
  playLevelUp: vi.fn(),
  playVictory: vi.fn(),
  playEnd: vi.fn(),
  playTimer10s: vi.fn(),
  playTimer30s: vi.fn(),
  playTick: vi.fn(),
}));

// The bag GameProgressManager hands to its children. GameLayout is supposed to
// forward all of it; it used to drop several keys on the floor.
const PROGRESS_BAG = {
  level: 3,
  setLevel: vi.fn(),
  score: 250,
  setScore: vi.fn(),
  xp: 40,
  setXp: vi.fn(),
  bestLevel: 5,
  bestScore: 900,
  xpToNextLevel: 70,
  levelProgress: 0.5,
  handleGameOver: vi.fn(),
  handleGameComplete: vi.fn(),
  resetProgress: vi.fn(),
  isVictory: false,
  handleSuccess: vi.fn(),
  handleWrong: vi.fn(),
  streak: 4,
  maxStreak: 7,
  lastCorrectTime: 1234,
  mistakes: 6,
  setMistakes: vi.fn(),
  correctAnswers: 11,
  result: null,
  setResult: vi.fn(),
};

vi.mock("./GameProgressManager.jsx", () => ({
  default: ({ children }) => children(PROGRESS_BAG),
}));

let GameLayout;

beforeEach(async () => {
  vi.resetModules();
  GameLayout = (await import("./GameLayout.jsx")).default;
});

function renderAndCaptureBag() {
  let received = null;
  render(
    <MemoryRouter>
      <GameLayout
        gameName="Number Recall"
        introSlides={[]}
        helpText=""
        token="test-token"
        fetchUserGameProgress={vi.fn().mockResolvedValue({})}
        submitGameScore={vi.fn().mockResolvedValue({})}
      >
        {(game) => {
          received = game;
          return <div data-testid="game-body" />;
        }}
      </GameLayout>
    </MemoryRouter>
  );

  // The game body only renders once the intro panel is dismissed.
  act(() => {
    fireEvent.click(screen.getByRole("button", { name: /start exercise/i }));
  });
  expect(screen.getByTestId("game-body")).toBeInTheDocument();
  return received;
}

describe("GameLayout child prop contract", () => {
  it("forwards handleGameComplete", () => {
    // Regression: this was destructured into an unused `...soundApi` rest and
    // never passed on, so every game's success path silently no-opped.
    const bag = renderAndCaptureBag();
    expect(bag.handleGameComplete).toBe(PROGRESS_BAG.handleGameComplete);
  });

  it("forwards the real mistakes count and setter", () => {
    // Regression: these were hardcoded to `0` and `() => {}`, so mistakes
    // collected by games never reached the submitted payload.
    const bag = renderAndCaptureBag();
    expect(bag.mistakes).toBe(6);
    expect(bag.setMistakes).toBe(PROGRESS_BAG.setMistakes);
  });

  it("forwards the streak and accuracy fields games report on", () => {
    const bag = renderAndCaptureBag();
    expect(bag.maxStreak).toBe(7);
    expect(bag.correctAnswers).toBe(11);
    expect(bag.streak).toBe(4);
  });

  it("forwards every scoring key the progress manager exposes", () => {
    const bag = renderAndCaptureBag();
    for (const key of [
      "level",
      "score",
      "xp",
      "bestLevel",
      "bestScore",
      "handleGameOver",
      "handleSuccess",
      "handleWrong",
      "resetProgress",
    ]) {
      expect(bag, `missing ${key}`).toHaveProperty(key);
    }
  });
});
