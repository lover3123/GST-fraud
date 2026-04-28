type RiskBadgeProps = {
  score: number;
};

const RISK_STYLES = [
  { limit: 0.33, className: "bg-emerald-50 text-emerald-700" },
  { limit: 0.66, className: "bg-amber-50 text-amber-700" },
  { limit: 1, className: "bg-red-50 text-red-700" },
];

export default function RiskBadge({ score }: RiskBadgeProps) {
  const style = RISK_STYLES.find((entry) => score <= entry.limit) ?? RISK_STYLES[2];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}>
      {Math.round(score * 100)}% risk
    </span>
  );
}
