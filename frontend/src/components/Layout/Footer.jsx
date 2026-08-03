const REPO = "https://github.com/Lioua-Kyto/Cognitive";

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-ground">
      <div className="mx-auto flex max-w-frame flex-col gap-3 px-4 py-8 text-body-s text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Cognitive — seven domains, measured
          separately.
        </p>
        {/* Privacy, Terms and About linked to routes that never existed and now
            hit the 404 page. They come back when there is something real behind
            them; a policy is not something to invent. */}
        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-hair hover:text-beam"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
