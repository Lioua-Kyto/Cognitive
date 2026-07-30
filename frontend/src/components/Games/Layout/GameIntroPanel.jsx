import React from "react";

export default function GameIntroPanel({
  show = true,
  introSlides = [],
  slideIndex = 0,
  slideAnim = "",
  handlePrevSlide = () => {},
  handleNextSlide = () => {},
  sliderLevel = 1,
  bestLevel = 1,
  handleSliderChange = () => {},
  handleStart = () => {},
  navigate = () => {},
  maxLevel = 1,
}) {
  if (!show) return null;

  // Calculate marker position as a percent of the track
  const markerPercent =
    maxLevel > 1 ? ((bestLevel - 1) / (maxLevel - 1)) * 100 : 0;

  return (
    <div className="intro-panel d-flex flex-column h-100">
      {/* Section 2: Slides */}
      <div className="intro-slides flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="d-flex align-items-center justify-content-between w-100 overflow-hidden">
          {slideIndex > 0 ? (
            <button
              className="btn btn-light fs-2 me-3"
              onClick={handlePrevSlide}
            >
              &larr;
            </button>
          ) : (
            <div style={{ width: "48px" }} />
          )}
          <div className="flex-grow-1 d-flex align-items-center justify-content-center">
            <div
              className={`flex-grow-1 text-start intro-slide-anim ${slideAnim}`}
            >
              <h3 className="text-primary">{introSlides[slideIndex]?.title}</h3>
              <p className="fs-5" style={{ whiteSpace: "pre-line" }}>
                {introSlides[slideIndex]?.desc}
              </p>
            </div>
            {introSlides[slideIndex]?.img && (
              <img
                src={introSlides[slideIndex].img}
                alt=""
                className={`intro-img ms-4 intro-slide-anim ${slideAnim}`}
              />
            )}
          </div>
          {slideIndex < introSlides.length - 1 ? (
            <button
              className="btn btn-light fs-2 ms-3"
              onClick={handleNextSlide}
            >
              &rarr;
            </button>
          ) : (
            <div style={{ width: "48px" }} />
          )}
        </div>
      </div>
      {/* Section 3: Slider + Buttons */}
      <div
        className="intro-controls mt-4 position-relative"
        style={{ width: "100%" }}
      >
        <label
          htmlFor="levelSlider"
          className="form-label fw-bold text-primary fs-6"
        >
          Level {sliderLevel} / {maxLevel || bestLevel}
        </label>
        <div
          className="slider-marker-wrapper"
          style={{ position: "relative", width: "50%", margin: "0 auto" }}
        >
          {/* Marker inside the track */}
          <div
            className="slider-best-marker"
            style={{
              left: `calc(${markerPercent}% - 10px)`, // adjust for marker width
              top: "50%",
              transform: "translateY(-50%)", // center vertically
              pointerEvents: "none",
            }}
            title={`Best Level: ${bestLevel}`}
          >
            <span
              role="img"
              aria-label="best"
              style={{
                fontSize: 20,
                color: "#22c55e",
                filter: "drop-shadow(0 1px 2px #fff)",
              }}
            >
              🏆
            </span>
          </div>
          {/* Slider */}
          <input
            id="levelSlider"
            type="range"
            className="form-range w-100"
            min={1}
            max={maxLevel}
            value={sliderLevel}
            step={1}
            onChange={handleSliderChange}
            style={{
              height: 8,
              borderRadius: 4,
              zIndex: 1,
              position: "relative",
            }}
          />
        </div>
        <div className="d-flex gap-3 mt-2">
          <button
            className="btn btn-playful-alt"
            onClick={() => navigate(`/games`)}
          >
            Switch Exercise
          </button>
          <button
            className="btn btn-playful-main"
            disabled={sliderLevel > (maxLevel || bestLevel)}
            onClick={() => handleStart(sliderLevel)}
          >
            <span className="intro-btn-content">
              Start Exercise <span className="intro-btn-arrow">&rarr;</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
