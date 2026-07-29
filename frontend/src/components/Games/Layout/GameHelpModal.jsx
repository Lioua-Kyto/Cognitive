import React from "react";
import { createPortal } from "react-dom";
import "./Styles/GameHelpModal.css";

export default function GameHelpModal({ show, onClose, helpText }) {
  if (!show) return null;
  return createPortal(
    <div className="game-help-modal-backdrop" onClick={onClose}>
      <div
        className="game-help-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="game-help-modal-content">
          <div className="game-help-modal-header">
            <div className="help-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h5 className="modal-title">How to Play</h5>
            <button className="close-btn" onClick={onClose}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="game-help-modal-body">
            <div className="help-text-container">
              <p className="help-text">{helpText}</p>
            </div>
          </div>
          <div className="game-help-modal-footer">
            <button className="btn btn-help-understood" onClick={onClose}>
              <span>Got it!</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
