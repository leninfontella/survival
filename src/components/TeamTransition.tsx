import { motion } from "framer-motion";
import { Team } from "@/types/game";

interface TeamTransitionProps {
  team: Team;
  onComplete: () => void;
}

export function TeamTransition({ team, onComplete }: TeamTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      onAnimationComplete={() => {
        setTimeout(onComplete, 1500);
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 3, opacity: 0.1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.8,
          }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 blur-3xl bg-primary rounded-full"
          />

          {/* Team badge */}
          <div className="relative w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-card via-background to-card border-4 border-primary shadow-2xl shadow-primary/50 flex items-center justify-center">
            <img
              src={team.logo}
              alt={team.name}
              className="w-32 h-32 object-contain"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/128x128?text=" +
                  team.name.charAt(0);
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {team.name}
          </h2>
          <p className="text-2xl text-muted-foreground font-semibold">
            Sua escolha para esta rodada
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
