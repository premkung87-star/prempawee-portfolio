// 5×7 dot-matrix font for digits 0-9. Rendered via grid divs, monospace-aligned.
// Used in the Process section to mark step numbers in dot-matrix style — echoes
// the "nano · dot" theme keyword from the design brief.

const MAP: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

function Digit({ ch, dot }: { ch: string; dot: number }) {
  const grid = MAP[ch] ?? MAP["0"];
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(5, ${dot}px)`,
        gap: 3,
      }}
    >
      {grid.flatMap((row, ri) =>
        row.split("").map((c, ci) => (
          <div
            key={`${ri}-${ci}`}
            style={{
              width: dot,
              height: dot,
              background: c === "1" ? "#fff" : "transparent",
              border: c === "1" ? "none" : "0.5px solid rgba(255,255,255,0.06)",
            }}
          />
        )),
      )}
    </div>
  );
}

export function DotMatrixNumber({
  str,
  dot = 8,
}: {
  str: string;
  dot?: number;
}) {
  return (
    <div className="flex" style={{ gap: dot * 1.4 }}>
      {str.split("").map((c, i) => (
        <Digit key={i} ch={c} dot={dot} />
      ))}
    </div>
  );
}
