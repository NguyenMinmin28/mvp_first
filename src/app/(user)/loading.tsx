export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="flex items-end gap-2 select-none" aria-label="Loading">
        {["C", "L", "E", "V", "R", "S"].map((char, idx) => (
          <span
            key={idx}
            className={
              "clevrs-letter text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wide " +
              (char === "V" ? " clevrs-v" : "")
            }
            style={{ animationDelay: `${idx * 120}ms` }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
