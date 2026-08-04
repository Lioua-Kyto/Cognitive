import { absoluteUrl } from "../api/config.js";

const SIZES = {
  sm: "size-8 text-body-s",
  md: "size-10 text-body",
  lg: "size-16 text-heading-s",
};

const DOTS = {
  sm: "size-2 -right-0.5 -bottom-0.5",
  md: "size-2.5 -right-0.5 -bottom-0.5",
  lg: "size-3 -right-1 -bottom-1",
};

/**
 * User avatar with an optional presence dot.
 *
 * Four surfaces had their own copy of "image, or the first letter in a box",
 * each with a slightly different fallback chain and a presence dot whose only
 * meaning was its colour. The dot carries a label here.
 */
export default function Avatar({
  name = "",
  src,
  size = "md",
  status,
  ringClass = "border-surface",
}) {
  const resolved = absoluteUrl(src);

  return (
    <div className="relative shrink-0">
      {resolved ? (
        <img
          src={resolved}
          alt=""
          className={`${SIZES[size]} rounded-room border border-rule object-cover`}
        />
      ) : (
        <div
          className={`${SIZES[size]} flex items-center justify-center rounded-room border border-rule bg-surface-raised text-ink-muted`}
        >
          {(name[0] ?? "?").toUpperCase()}
        </div>
      )}
      {status && (
        <span
          role="img"
          aria-label={status === "online" ? "Online" : "Offline"}
          className={`absolute rounded-full border-2 ${ringClass} ${DOTS[size]} ${
            status === "online" ? "bg-positive" : "bg-shadow"
          }`}
        />
      )}
    </div>
  );
}
