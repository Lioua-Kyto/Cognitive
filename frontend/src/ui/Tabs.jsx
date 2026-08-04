import { useId, useRef } from "react";

/**
 * Tab set with the keyboard contract the role implies.
 *
 * Every tab strip in this codebase was a row of plain buttons toggling a state
 * variable: no tablist, no tabpanel, no relationship between the two, and arrow
 * keys did nothing. A tab that is only a button is a lie told to a screen reader.
 *
 * Automatic activation — moving focus selects — which is the expected behaviour
 * when panels are already loaded.
 */
export default function Tabs({
  label,
  tabs,
  active,
  onChange,
  className = "",
  panelClassName = "",
}) {
  const baseId = useId();
  const stripRef = useRef(null);

  const tabId = (id) => `${baseId}-tab-${id}`;
  const panelId = (id) => `${baseId}-panel-${id}`;

  const onKeyDown = (event) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const jump = { Home: 0, End: tabs.length - 1 }[event.key];
    if (delta === undefined && jump === undefined) return;

    event.preventDefault();
    const current = tabs.findIndex((t) => t.id === active);
    const next =
      jump !== undefined
        ? jump
        : (current + delta + tabs.length) % tabs.length;

    onChange(tabs[next].id);
    stripRef.current?.querySelector(`#${CSS.escape(tabId(tabs[next].id))}`)?.focus();
  };

  const current = tabs.find((t) => t.id === active);

  return (
    <div className={className}>
      <div
        ref={stripRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex border-b border-rule"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(tab.id)}
              // Only the selected tab is in the tab order; arrows move within.
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`font-label -mb-px flex flex-1 items-center justify-center gap-2 border-b px-3 py-3 text-label transition-colors duration-hair ${
                selected
                  ? "border-beam text-beam"
                  : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span
                  data-figure
                  className={`rounded-hair px-1.5 text-body-s ${
                    selected ? "bg-beam text-poche" : "bg-rule text-ink-muted"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={panelId(active)}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className={panelClassName}
      >
        {current?.content}
      </div>
    </div>
  );
}
