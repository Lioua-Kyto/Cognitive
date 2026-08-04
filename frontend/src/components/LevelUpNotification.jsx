import { useLevelUp } from "../context/LevelUpContext";
import Button from "../ui/Button.jsx";
import Dialog from "../ui/Dialog.jsx";

/**
 * The level-up moment.
 *
 * The version this replaces was an unlabelled overlay with forty animated
 * particles and a line reading "You're now in the top N% of all players" — where
 * N was `100 - level * 8`, invented on the client. There is no ranking behind it,
 * so it is gone. What is left is the one thing that is actually true: the number
 * went up.
 */
const LevelUpNotification = () => {
  const { levelUpData, clearLevelUp } = useLevelUp();

  if (!levelUpData) return null;

  return (
    <Dialog open onClose={clearLevelUp} size="sm">
      <div className="flex flex-col items-center text-center">
        <p className="font-label text-label text-beam">Level up</p>

        {/* The beam arriving in the room, drawn once rather than confettied. */}
        <div className="relative mt-6 flex size-28 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-beam/12 blur-xl"
          />
          <div className="relative flex size-full items-center justify-center rounded-full border border-beam">
            <span
              data-figure
              className="text-figure-xl font-semibold text-beam"
            >
              {levelUpData.newLevel}
            </span>
          </div>
        </div>

        <h2 className="mt-6 font-display text-heading-m text-lit">
          You reached level {levelUpData.newLevel}
        </h2>
        <p data-figure className="mt-2 text-body-s text-ink-muted">
          {levelUpData.oldLevel} → {levelUpData.newLevel}
        </p>

        <Button className="mt-8 w-full" onClick={clearLevelUp}>
          Continue
        </Button>
      </div>
    </Dialog>
  );
};

export default LevelUpNotification;
