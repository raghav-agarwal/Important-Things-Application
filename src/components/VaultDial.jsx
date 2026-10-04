export default function VaultDial({ unlocked = false, size = 120 }) {
  const ticks = Array.from({ length: 24 });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`vault-dial ${unlocked ? "vault-dial-unlocked" : ""}`}
    >
      <circle cx="60" cy="60" r="56" fill="none" stroke="var(--hairline)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="46" fill="var(--panel)" stroke="var(--hairline)" strokeWidth="1" />
      <g className="vault-dial-ticks">
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * Math.PI * 2;
          const inner = 40;
          const outer = i % 6 === 0 ? 34 : 37;
          const x1 = 60 + inner * Math.cos(angle);
          const y1 = 60 + inner * Math.sin(angle);
          const x2 = 60 + outer * Math.cos(angle);
          const y2 = 60 + outer * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--brass)"
              strokeWidth={i % 6 === 0 ? 1.6 : 0.9}
              opacity={i % 6 === 0 ? 0.9 : 0.4}
            />
          );
        })}
      </g>
      <g className="vault-dial-handle">
        <line x1="60" y1="60" x2="60" y2="30" stroke="var(--brass-bright)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="5" fill="var(--brass-bright)" />
      </g>
      <circle cx="60" cy="60" r="3" fill="var(--ink)" />
    </svg>
  );
}
