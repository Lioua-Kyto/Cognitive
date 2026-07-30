import { useRef } from "react";

export default function GameWindow({ children }) {
  const windowRef = useRef(null);

  return (
    <div
      ref={windowRef}
      style={{
  minHeight: "calc(100vh - 90px - 32px)",
  height: "calc(100vh - 90px - 32px)",
        minWidth: 0,
        margin: "16px 20px",
        background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        borderRadius: "2.5rem",
        overflow: "hidden",
      }}
    >
  <div className="game-container" style={{display:"flex", flexDirection:"column", flex:1, width:"100%"}}>{children}</div>
    </div>
  );
}
