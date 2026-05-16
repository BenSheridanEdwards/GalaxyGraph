import { mutatorCategory } from "./helpers";

interface Props {
  mutator: string;
}

export default function MutatorBadge({ mutator }: Props) {
  const cat = mutatorCategory(mutator);
  return (
    <span
      data-testid="mutator-badge"
      title={cat.hint}
      style={{
        display: "inline-block",
        fontSize: 9,
        letterSpacing: ".5px",
        textTransform: "uppercase",
        padding: "1px 6px",
        borderRadius: 3,
        color: cat.color,
        background: cat.color + "1f",
        border: `1px solid ${cat.color}55`,
        marginRight: 6,
        verticalAlign: "1px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {cat.label}
    </span>
  );
}
