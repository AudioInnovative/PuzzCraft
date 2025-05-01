import { cn } from "../../lib/utils";

interface GamePanelProps {
  title: string;
  value: string;
  alert?: boolean;
}

export function GamePanel({ title, value, alert = false }: GamePanelProps) {
  return (
    <div className="min-w-[100px] text-white">
      <h3 className="text-sm uppercase font-bold tracking-wider mb-1">{title}</h3>
      <p className={cn(
        "text-lg font-bold font-mono", 
        alert ? "text-red-500 animate-pulse" : "text-cyan-300"
      )}>
        {value}
      </p>
    </div>
  );
}
