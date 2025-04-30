import { cn } from "@/lib/utils";

interface GamePanelProps {
  title: string;
  value: string;
  alert?: boolean;
}

export function GamePanel({ title, value, alert = false }: GamePanelProps) {
  return (
    <div className="bg-black/70 text-white p-2 rounded-lg min-w-[100px] text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className={cn("text-lg", alert && "text-red-500 animate-pulse font-bold")}>
        {value}
      </p>
    </div>
  );
}
