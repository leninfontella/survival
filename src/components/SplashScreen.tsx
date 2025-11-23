import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [showBall, setShowBall] = useState(false);
  const [showCracks, setShowCracks] = useState(false);
  const [shatter, setShatter] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowBall(true), 300);
    const timer2 = setTimeout(() => setShowCracks(true), 1500);
    const timer3 = setTimeout(() => setShatter(true), 1800);
    const timer4 = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-card to-background overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: shatter ? 0 : 1 }}
      transition={{ duration: 0.6, delay: shatter ? 0.2 : 0 }}
    >
      {/* Glass overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      {/* Crack patterns */}
      {showCracks && (
        <>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-gradient-to-r from-transparent via-primary/20 to-transparent"
              style={{
                width: "2px",
                height: `${Math.random() * 300 + 200}px`,
                top: "50%",
                left: "50%",
                transformOrigin: "top center",
                rotate: `${i * 30}deg`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{
                scaleY: 1,
                opacity: [0, 1, 0.5],
                filter: ["blur(0px)", "blur(2px)"],
              }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
            />
          ))}

          {/* Circular cracks */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={`ring-${ring}`}
              className="absolute border-2 border-primary/30 rounded-full"
              style={{
                width: `${ring * 150}px`,
                height: `${ring * 150}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: [0, 0.8, 0.3],
              }}
              transition={{ duration: 0.4, delay: 0.1 + ring * 0.05 }}
            />
          ))}
        </>
      )}

      {/* Shatter fragments */}
      {shatter && (
        <>
          {[...Array(20)].map((_, i) => {
            const angle = (i / 20) * 360;
            const distance = 800;
            return (
              <motion.div
                key={`fragment-${i}`}
                className="absolute w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/10 backdrop-blur-sm"
                style={{
                  top: "50%",
                  left: "50%",
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                }}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * distance,
                  y: Math.sin((angle * Math.PI) / 180) * distance,
                  rotate: Math.random() * 720 - 360,
                  opacity: 0,
                  scale: 0.5,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            );
          })}
        </>
      )}

      {/* Soccer ball */}
      <motion.div
        className="relative z-10"
        initial={{ y: -1000, rotate: 0 }}
        animate={
          showBall
            ? {
                y: 0,
                rotate: 720,
              }
            : {}
        }
        transition={{
          duration: 1.2,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <motion.div
          className="relative w-32 h-32"
          animate={
            showCracks ? { scale: [1, 1.1, 1], rotate: [0, -10, 10, 0] } : {}
          }
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Ball shadow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-xl opacity-50"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Ball */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-foreground via-muted-foreground to-foreground shadow-2xl overflow-hidden">
            {/* Soccer ball pentagon pattern */}
            <div className="absolute inset-0">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-8 h-8 bg-card"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-35px)`,
                    clipPath:
                      "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                  }}
                />
              ))}
              <div
                className="absolute top-1/2 left-1/2 w-10 h-10 bg-card -translate-x-1/2 -translate-y-1/2"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                }}
              />
            </div>

            {/* Ball shine */}
            <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-primary-foreground/40 to-transparent rounded-full blur-sm" />
          </div>
        </motion.div>
      </motion.div>

      {/* Title animation */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: shatter ? 0 : 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Sobrevivente
        </h1>
        <motion.p
          className="text-muted-foreground text-center mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Preparando sua experiência...
        </motion.p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: shatter ? 0 : [0, 1, 1] }}
        transition={{ duration: 0.5, delay: 1.2, times: [0, 0.5, 1] }}
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
