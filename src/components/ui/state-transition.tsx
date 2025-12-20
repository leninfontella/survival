import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StateTransitionProps {
  children: ReactNode;
  state: string | number;
  className?: string;
}

export function StateTransition({
  children,
  state,
  className = "",
}: StateTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
