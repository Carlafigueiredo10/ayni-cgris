import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { ReincidenciaResult } from "@/types/registro";

type Props = {
  open: boolean;
  result: ReincidenciaResult | null;
  onConfirm: (respostas: Record<string, string>) => void;
  onCancel: () => void;
};

export default function ReincidenciaModal({
  open,
  result,
  onConfirm,
  onCancel,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [acao, setAcao] = useState("");

  if (!result) return null;

  const isSelf = result.reincidence_type === "self";
  const title = isSelf
    ? "Reincidencia detectada (mesmo servidor)"
    : "Processo ja analisado por outro servidor";
  const severity = isSelf ? "destructive" : "outline";
  const wasConcluded = !!result.already_concluded;

  const handleConfirm = () => {
    onConfirm({ motivo, acao });
    setMotivo("");
    setAcao("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isSelf ? (
              <>
                Voce ja analisou este processo{" "}
                <strong>{result.same_server_count} vez(es)</strong>. Preencha
                os campos abaixo antes de prosseguir.
              </>
            ) : (
              <>
                Este processo ja foi analisado{" "}
                <strong>{result.previous_count} vez(es)</strong> na sua equipe.
                Os campos abaixo sao opcionais.
              </>
            )}
          </DialogDescription>
          {(wasConcluded || result.last_status) && (
            <div className="mt-2 text-sm space-y-1">
              {wasConcluded && (
                <p className="text-destructive font-medium">
                  ⚠ Este processo ja foi <strong>concluido</strong>{" "}
                  anteriormente — confirme se realmente precisa ser reaberto.
                </p>
              )}
              {result.last_status && !wasConcluded && (
                <p className="text-muted-foreground">
                  Ultimo status registrado:{" "}
                  <strong>{result.last_status}</strong>
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>
              Por que este processo esta sendo analisado novamente?
              {isSelf && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>
              Qual acao sera tomada?
              {isSelf && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              placeholder="Descreva a acao..."
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant={severity}
            onClick={handleConfirm}
            disabled={isSelf && (!motivo.trim() || !acao.trim())}
          >
            Confirmar e registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
