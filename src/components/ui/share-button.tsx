import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface ShareButtonProps {
  roomId: string;
  roomName: string;
}

export function ShareButton({ roomId, roomName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/room/${roomId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      toast({
        title: "✅ Link Copiado!",
        description: "O link da sala foi copiado para a área de transferência",
        duration: 3000,
        className:
          "border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-xl",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sala: ${roomName}`,
          text: `Entre na sala de sobrevivência: ${roomName}`,
          url: shareUrl,
        });
      } catch (err) {
        // Usuário cancelou o compartilhamento
        console.log("Share cancelled");
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all group"
        >
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ duration: 0.2 }}
          >
            <Share2 className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
          </motion.div>
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-card/95 backdrop-blur-xl border-primary/20"
      >
        <DropdownMenuItem
          onClick={copyToClipboard}
          className="cursor-pointer hover:bg-primary/10 transition-colors"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2 w-full"
              >
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-500 font-medium">Copiado!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2 w-full"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar Link</span>
              </motion.div>
            )}
          </AnimatePresence>
        </DropdownMenuItem>

        {navigator.share && (
          <DropdownMenuItem
            onClick={shareNative}
            className="cursor-pointer hover:bg-primary/10 transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            <span>Compartilhar...</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={copyToClipboard}
          className="cursor-pointer hover:bg-primary/10 transition-colors text-xs text-muted-foreground"
        >
          <LinkIcon className="h-3 w-3 mr-2" />
          <span className="truncate">{shareUrl}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
