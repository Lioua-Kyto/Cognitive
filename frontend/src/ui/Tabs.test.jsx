import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import Tabs from "./Tabs.jsx";

const TABS = [
  { id: "a", label: "Alpha", content: <p>Alpha panel</p> },
  { id: "b", label: "Beta", badge: 3, content: <p>Beta panel</p> },
  { id: "c", label: "Gamma", content: <p>Gamma panel</p> },
];

function Harness({ onChange = () => {} }) {
  const [active, setActive] = useState("a");
  return (
    <Tabs
      label="Sections"
      tabs={TABS}
      active={active}
      onChange={(id) => {
        setActive(id);
        onChange(id);
      }}
    />
  );
}

describe("Tabs keyboard contract", () => {
  it("exposes a tablist whose selected tab owns the panel", () => {
    render(<Harness />);

    expect(screen.getByRole("tablist")).toHaveAccessibleName("Sections");
    const selected = screen.getByRole("tab", { selected: true });
    expect(selected).toHaveTextContent("Alpha");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Alpha");
  });

  it("renders only the selected panel", () => {
    render(<Harness />);

    expect(screen.getByText("Alpha panel")).toBeInTheDocument();
    expect(screen.queryByText("Beta panel")).toBeNull();
  });

  it("keeps a single tab stop, so Tab leaves the strip instead of walking it", () => {
    render(<Harness />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });

  it("moves selection with the arrow keys and wraps", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const strip = screen.getByRole("tablist");

    fireEvent.keyDown(strip, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("b");

    fireEvent.keyDown(strip, { key: "ArrowLeft" });
    fireEvent.keyDown(strip, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("c");
  });

  it("jumps to the ends with Home and End", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const strip = screen.getByRole("tablist");

    fireEvent.keyDown(strip, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("c");

    fireEvent.keyDown(strip, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("a");
  });

  it("moves focus with selection, so the arrow keys are not a dead end", () => {
    render(<Harness />);
    const strip = screen.getByRole("tablist");

    fireEvent.keyDown(strip, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /Beta/ })).toHaveFocus();
  });

  it("hides a zero badge rather than drawing an empty count", () => {
    render(
      <Tabs
        label="Sections"
        active="a"
        onChange={() => {}}
        tabs={[
          { id: "a", label: "Alpha", badge: 0, content: null },
          { id: "b", label: "Beta", badge: 3, content: null },
        ]}
      />
    );

    expect(screen.getByRole("tab", { name: /Alpha/ })).not.toHaveTextContent("0");
    expect(screen.getByRole("tab", { name: /Beta/ })).toHaveTextContent("3");
  });
});
