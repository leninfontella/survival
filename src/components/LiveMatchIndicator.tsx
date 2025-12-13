import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Circle, Radio } from "lucide-react";

interface LiveMatchIndicatorProps {
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function LiveMatchIndicator({
  count = 0,
  size = "md",
  showCount = true,
  className = "",
}: LiveMatchIndicatorProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (count === 0 && showCount) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={className}
    >
      <Badge
        variant="destructive"
        className={`
          ${sizeClasses[size]}
          relative overflow-hidden
          shadow-lg shadow-red-500/30
        `}
      >
        {/* Animação de pulso de fundo */}
        <motion.div
          className="absolute inset-0 bg-white/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Conteúdo */}
        <div className="relative flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Circle className={`${iconSizes[size]} fill-current`} />
          </motion.div>

          <span className="font-bold">AO VIVO</span>

          {showCount && count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold"
            >
              {count}
            </motion.span>
          )}
        </div>
      </Badge>
    </motion.div>
  );
}

interface LiveMatchPulseProps {
  size?: number;
  color?: string;
}

export function LiveMatchPulse({
  size = 8,
  color = "rgb(239, 68, 68)",
}: LiveMatchPulseProps) {
  return (
    <div className="relative inline-flex">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <motion.div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

interface LiveBroadcastBadgeProps {
  elapsed?: number;
  status?: string;
}

export function LiveBroadcastBadge({
  elapsed,
  status = "1H",
}: LiveBroadcastBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <Badge
        variant="destructive"
        className="flex items-center gap-1.5 px-3 py-1.5 shadow-lg"
      >
        <LiveMatchPulse size={8} />
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold leading-none">AO VIVO</span>
          {elapsed && (
            <span className="text-[10px] opacity-80 leading-none mt-0.5">
              {elapsed}' {status}
            </span>
          )}
        </div>
      </Badge>
    </motion.div>
  );
}

interface LiveMatchCounterProps {
  liveCount: number;
  totalCount: number;
}

export function LiveMatchCounter({
  liveCount,
  totalCount,
}: LiveMatchCounterProps) {
  if (liveCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border-2 border-red-500/30 rounded-full"
    >
      <Radio className="w-5 h-5 text-red-500 animate-pulse" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground leading-none">
          Partidas ao vivo
        </span>
        <span className="text-lg font-bold text-red-500 leading-none">
          {liveCount}/{totalCount}
        </span>
      </div>
    </motion.div>
  );
}
