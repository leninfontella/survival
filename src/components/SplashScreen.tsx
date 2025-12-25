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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-background overflow-hidden"
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
                height: `${Math.random() * 200 + 150}px`,
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
                width: `${ring * 100}px`,
                height: `${ring * 100}px`,
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
            const distance =
              typeof window !== "undefined" && window.innerWidth < 640
                ? 500
                : 800;
            return (
              <motion.div
                key={`fragment-${i}`}
                className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary/20 to-accent/10 backdrop-blur-sm"
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

      {/* Main content container - centered vertically */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Soccer ball */}
        <motion.div
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
            className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
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
                    className="absolute top-1/2 left-1/2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-card"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-26px)`,
                      clipPath:
                        "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                    }}
                  />
                ))}
                <div
                  className="absolute top-1/2 left-1/2 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-card -translate-x-1/2 -translate-y-1/2"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                  }}
                />
              </div>

              {/* Ball shine */}
              <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 md:top-4 md:left-4 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-foreground/40 to-transparent rounded-full blur-sm" />
            </div>
          </motion.div>
        </motion.div>

        {/* Title animation */}
        <motion.div
          className="mt-8 sm:mt-10 md:mt-12 px-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: shatter ? 0 : 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Sobrevivente
          </h1>
          <motion.p
            className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2 sm:mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Preparando sua experiência...
          </motion.p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          className="mt-6 sm:mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: shatter ? 0 : [0, 1, 1] }}
          transition={{ duration: 0.5, delay: 1.2, times: [0, 0.5, 1] }}
        >
          <div className="flex gap-1.5 sm:gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary"
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
      </div>
    </motion.div>
  );
};
