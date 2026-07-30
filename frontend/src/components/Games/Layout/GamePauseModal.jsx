import React from "react";
import { createPortal } from "react-dom";

export default function GamePauseModal({
  show,
  soundOn = true,
  setSoundOn = () => {},
  handleResume = () => {},
  handleQuit = () => {},
  handlePauseRestart = () => {},
}) {
  if (!show) return null;
  return createPortal(
    <div className="game-pause-modal-backdrop" onClick={handleResume}>
      <div
        className="game-pause-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="game-pause-modal-content">
          <div className="game-pause-modal-header">
            <div className="pause-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4H6V20H10V4ZM18 4H14V20H18V4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h5 className="modal-title">Game Paused</h5>
            <div className="pause-pulse"></div>
          </div>

          <div className="game-pause-modal-body">
            <div className="settings-section">
              <div className="sound-toggle-container">
                <div className="sound-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {soundOn ? (
                      <path
                        d="M11 5L6 9H2V15H6L11 19V5ZM19.07 4.93L16.5 7.5C17.89 8.89 18.5 10.39 18.5 12C18.5 13.61 17.89 15.11 16.5 16.5L19.07 19.07C21.17 16.97 22 14.33 22 12C22 9.67 21.17 7.03 19.07 4.93ZM16.5 12C16.5 10.23 15.5 8.71 14 7.97V16.02C15.5 15.29 16.5 13.77 16.5 12Z"
                        fill="currentColor"
                      />
                    ) : (
                      <path
                        d="M11 5L6 9H2V15H6L11 19V5ZM22 12L19.07 9.07L17.66 10.48L20.59 13.41L17.66 16.34L19.07 17.75L22 14.82L22 12Z"
                        fill="currentColor"
                      />
                    )}
                  </svg>
                </div>
                <div className="sound-toggle-content">
                  <label className="sound-label">Sound Effects</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="soundSwitch"
                      checked={soundOn}
                      onChange={() => setSoundOn((v) => !v)}
                      className="toggle-input"
                    />
                    <label htmlFor="soundSwitch" className="toggle-label">
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pause-actions">
              <button className="btn btn-resume" onClick={handleResume}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                </svg>
                <span>Resume Game</span>
              </button>

              <button className="btn btn-restart" onClick={handlePauseRestart}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Restart Challenge</span>
              </button>

              <button className="btn btn-quit" onClick={handleQuit}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 7L18.36 6.64L12 12L5.64 6.64L5 7L11.36 12L5 17.36L5.64 18L12 12.64L18.36 18L19 17.36L12.64 12L19 7Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Quit to Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
