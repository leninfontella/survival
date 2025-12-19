import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface EmojiReactionsProps {
  targetId: string; // ID do jogador ou elemento
  currentUserId: string;
  onReact?: (emoji: string) => void;
  reactions?: Reaction[];
}

const AVAILABLE_EMOJIS = [
  { emoji: '🔥', label: 'Fogo' },
  { emoji: '💪', label: 'Força' },
  { emoji: '👏', label: 'Aplauso' },
  { emoji: '😂', label: 'Rindo' },
  { emoji: '😱', label: 'Chocado' },
  { emoji: '🎯', label: 'Na mosca' },
  { emoji: '⚡', label: 'Rápido' },
  { emoji: '💀', label: 'Morto' },
];

export function EmojiReactions({
  targetId,
  currentUserId,
  onReact,
  reactions = [],
}: EmojiReactionsProps) {
  const [localReactions, setLocalReactions] = useState<Reaction[]>(reactions);
  const [showPopover, setShowPopover] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; x: number }[]
  >([]);

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  const handleReaction = (emoji: string) => {
    // Adicionar emoji flutuante
    const id = Date.now();
    const x = Math.random() * 60 - 30; // -30 a +30 px
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);

    // Remover depois da animação
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);

    // Atualizar reações localmente (em produção, chamar API)
    setLocalReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        const hasUserReacted = existing.users.includes(currentUserId);
        if (hasUserReacted) {
          // Remover reação
          return prev
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    users: r.users.filter((u) => u !== currentUserId),
                  }
                : r
            )
            .filter((r) => r.count > 0);
        } else {
          // Adicionar reação
          return prev.map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  count: r.count + 1,
                  users: [...r.users, currentUserId],
                }
              : r
          );
        }
      } else {
        // Nova reação
        return [...prev, { emoji, count: 1, users: [currentUserId] }];
      }
    });

    onReact?.(emoji);
    setShowPopover(false);
  };

  const userReactions = localReactions.filter((r) =>
    r.users.includes(currentUserId)
  );

  return (
    <div className="relative flex items-center gap-2">
      {/* Emojis Flutuantes */}
      <AnimatePresence>
        {floatingEmojis.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -100, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute pointer-events-none text-3xl z-50"
            style={{ left: `${item.x}px` }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reações Existentes */}
      <div className="flex items-center gap-1 flex-wrap">
        {localReactions.map((reaction) => {
          const hasUserReacted = reaction.users.includes(currentUserId);
          return (
            <motion.button
              key={reaction.emoji}
              onClick={() => handleReaction(reaction.emoji)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition-all ${
                hasUserReacted
                  ? 'bg-primary/20 border-2 border-primary/50 text-primary'
                  : 'bg-muted/50 border border-border hover:bg-muted hover:border-primary/30'
              }`}
            >
              <motion.span
                animate={hasUserReacted ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="text-lg"
              >
                {reaction.emoji}
              </motion.span>
              <span className="text-xs">{reaction.count}</span>

              {/* Tooltip com nomes */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {reaction.users.slice(0, 3).join(', ')}
                {reaction.users.length > 3 && ` +${reaction.users.length - 3}`}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Botão Adicionar Reação */}
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 border-dashed border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all group"
          >
            <motion.div
              whileHover={{ rotate: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Smile className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2 bg-card/95 backdrop-blur-xl border-primary/20"
          align="start"
        >
          <div className="grid grid-cols-4 gap-1">
            {AVAILABLE_EMOJIS.map((item, index) => (
              <motion.button
                key={item.emoji}
                onClick={() => handleReaction(item.emoji)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-primary/10 transition-colors"
                title={item.label}
              >
                {item.emoji}
              </motion.button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}