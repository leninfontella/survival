import { motion } from "framer-motion";
import { Skull, X } from "lucide-react";

interface EliminationEffectProps {
  playerName: string;
  onComplete?: () => void;
}

export function EliminationEffect({
  playerName,
  onComplete,
}: EliminationEffectProps) {
  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 0, opacity: 0, rotate: 360 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="relative"
    >
      {/* Overlay escuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        className="absolute inset-0 bg-black rounded-lg z-10"
      />

      {/* X vermelho */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1.5, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="absolute inset-0 flex items-center justify-center z-20"
      >
        <X className="w-24 h-24 text-red-500 stroke-[4]" />
      </motion.div>

      {/* Skull */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute inset-0 flex items-center justify-center z-20"
      >
        <Skull className="w-16 h-16 text-red-500" />
      </motion.div>

      {/* Texto ELIMINADO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2"
      >
        <span className="text-2xl font-black text-red-500">ELIMINADO</span>
        <span className="text-sm text-white">{playerName}</span>
      </motion.div>

      {/* Ondas de choque */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ delay: i * 0.2, duration: 1 }}
          className="absolute inset-0 border-4 border-red-500 rounded-lg z-10"
        />
      ))}
    </motion.div>
  );
}
