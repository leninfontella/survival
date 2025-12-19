import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const themes = [
    { value: "light" as Theme, label: "Claro", icon: Sun },
    { value: "dark" as Theme, label: "Escuro", icon: Moon },
    { value: "system" as Theme, label: "Sistema", icon: Monitor },
  ];

  const currentThemeData = themes.find((t) => t.value === theme) || themes[2];
  const CurrentIcon = currentThemeData.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all group relative overflow-hidden"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <CurrentIcon className="h-4 w-4 group-hover:text-primary transition-colors" />
          </motion.div>

          {/* Hover effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.5 }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-card/95 backdrop-blur-xl border-primary/20"
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`cursor-pointer transition-colors ${
                isActive
                  ? "bg-primary/20 text-primary font-semibold"
                  : "hover:bg-primary/10"
              }`}
            >
              <motion.div
                className="flex items-center gap-2 w-full"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-4 w-4" />
                <span>{themeOption.label}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
