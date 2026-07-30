import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dialog from "./Dialog.jsx";

function open(props = {}) {
  return render(
    <Dialog open title="Confirm" description="This cannot be undone" onClose={vi.fn()} {...props}>
      <button type="button">First</button>
      <button type="button">Second</button>
    </Dialog>
  );
}

describe("Dialog accessibility contract", () => {
  it("announces itself as a modal dialog with a name and description", () => {
    open();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Confirm");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone");
  });

  it("moves focus to the first control on open", () => {
    open();
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    open({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("traps Tab at the end and wraps to the start", () => {
    open();
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    second.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();
  });

  it("traps Shift+Tab at the start and wraps to the end", () => {
    open();
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(second).toHaveFocus();
  });

  it("restores focus to the opener on close", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    expect(opener).toHaveFocus();

    const { unmount } = open();
    expect(opener).not.toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("renders nothing when closed", () => {
    render(
      <Dialog open={false} title="Confirm">
        <button type="button">First</button>
      </Dialog>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
