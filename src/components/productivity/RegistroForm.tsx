import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Plus } from "lucide-react";
import type { Registro } from "@/types/registro";

const EMPTY: Registro = {
  data: "",
  processo: "",
  status: "Concluido",
  minutos: 0,
  documentoOuAcao: [],
  sistemaAjuste: "",
  tipoNatureza: "",
  tipoProcesso: "",
  tipoControle: "",
  motivoTempo: "",
  numPaginas: "",
  assunto: "",
  familiaridade: "",
  outroMotivo: "",
};

type Props = {
  onSubmit: (registro: Registro) => void;
  submitting?: boolean;
};

export default function RegistroForm({ onSubmit, submitting }: Props) {
  const [open, setOpen] = useState(true);
  const [novo, setNovo] = useState<Registro>({ ...EMPTY });

  const handleSubmit = () => {
    if (!novo.data || !novo.processo || !novo.minutos) return;
    onSubmit(novo);
    setNovo({ ...EMPTY });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-0 text-base font-semibold">
          Novo registro
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label>Data</Label>
            <Input
              type="date"
              value={novo.data}
              onChange={(e) => setNovo({ ...novo, data: e.target.value })}
            />
          </div>

          <div>
            <Label>Natureza</Label>
            <select
              value={novo.tipoNatureza}
              onChange={(e) =>
                setNovo({
                  ...novo,
                  tipoNatureza: e.target.value,
                  tipoProcesso: "",
                  tipoControle: "",
                })
              }
              className="w-full border rounded-md h-10 px-3 bg-background text-sm"
            >
              <option value="">Selecione</option>
              <option value="judicial">Judicial</option>
              <option value="controle">Controle</option>
            </select>
          </div>

          {novo.tipoNatureza === "judicial" && (
            <div>
              <Label>Tipo de processo</Label>
              <select
                value={novo.tipoProcesso}
                onChange={(e) => setNovo({ ...novo, tipoProcesso: e.target.value })}
                className="w-full border rounded-md h-10 px-3 bg-background text-sm"
              >
                <option value="">Selecione</option>
                <option value="subsidio">Subsidio</option>
                <option value="cumprimento">Cumprimento</option>
              </select>
            </div>
          )}

          {novo.tipoNatureza === "controle" && (
            <div>
              <Label>Indicio ou processo</Label>
              <select
                value={novo.tipoControle}
                onChange={(e) => setNovo({ ...novo, tipoControle: e.target.value })}
                className="w-full border rounded-md h-10 px-3 bg-background text-sm"
              >
                <option value="">Selecione</option>
                <option value="indicio">Indicio</option>
                <option value="processo">Processo</option>
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <Label>Numero do processo ou indicio</Label>
            <Input
              placeholder="Ex: 19975.000000/2025-11"
              value={novo.processo}
              onChange={(e) => setNovo({ ...novo, processo: e.target.value })}
            />
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={novo.status}
              onChange={(e) =>
                setNovo({ ...novo, status: e.target.value as Registro["status"] })
              }
              className="w-full border rounded-md h-10 px-3 bg-background text-sm"
            >
              <option>Concluido</option>
              <option>Encaminhado</option>
              <option>Solicitada informacao externa</option>
            </select>
          </div>

          <div>
            <Label>Tempo gasto (minutos)</Label>
            <Input
              type="number"
              step="1"
              placeholder="Ex: 30, 60, 90..."
              value={novo.minutos || ""}
              onChange={(e) =>
                setNovo({ ...novo, minutos: parseInt(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Jornada: 480 min/dia (8h)
            </p>

            {novo.minutos > 90 && (
              <div className="mt-3 space-y-2 p-3 border rounded-md bg-muted/30">
                <Label className="text-xs">Motivo do tempo elevado</Label>
                <div className="flex flex-col gap-1.5 text-sm">
                  {[
                    { v: "extenso", l: "Muito extenso" },
                    { v: "complexo", l: "Complexo" },
                    { v: "familiaridade", l: "Sem familiaridade" },
                    { v: "outro", l: "Outro" },
                  ].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="motivoTempo"
                        value={v}
                        checked={novo.motivoTempo === v}
                        onChange={() => setNovo({ ...novo, motivoTempo: v })}
                      />
                      {l}
                    </label>
                  ))}
                </div>

                {novo.motivoTempo === "extenso" && (
                  <div className="ml-6">
                    <Label className="text-xs">Paginas</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="50"
                      value={novo.numPaginas || ""}
                      onChange={(e) =>
                        setNovo({ ...novo, numPaginas: e.target.value })
                      }
                    />
                  </div>
                )}
                {(novo.motivoTempo === "complexo" ||
                  novo.motivoTempo === "familiaridade") && (
                  <div className="ml-6">
                    <Label className="text-xs">Qual assunto?</Label>
                    <Input
                      value={
                        novo.motivoTempo === "complexo"
                          ? novo.assunto || ""
                          : novo.familiaridade || ""
                      }
                      onChange={(e) =>
                        setNovo({
                          ...novo,
                          [novo.motivoTempo === "complexo"
                            ? "assunto"
                            : "familiaridade"]: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                {novo.motivoTempo === "outro" && (
                  <div className="ml-6">
                    <Label className="text-xs">Descreva</Label>
                    <Input
                      value={novo.outroMotivo || ""}
                      onChange={(e) =>
                        setNovo({ ...novo, outroMotivo: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-4">
            <Label>Documento ou acao</Label>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {[
                "Nota informativa",
                "Nota Tecnica",
                "Oficio",
                "Despacho",
                "Ajuste no sistema",
              ].map((doc) => (
                <label key={doc} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={novo.documentoOuAcao?.includes(doc) || false}
                    onChange={(e) => {
                      const arr = novo.documentoOuAcao || [];
                      setNovo({
                        ...novo,
                        documentoOuAcao: e.target.checked
                          ? [...arr, doc]
                          : arr.filter((d) => d !== doc),
                      });
                    }}
                  />
                  {doc}
                </label>
              ))}
            </div>

            {novo.documentoOuAcao?.includes("Ajuste no sistema") && (
              <div className="mt-2">
                <Label className="text-xs">Qual sistema?</Label>
                <select
                  value={novo.sistemaAjuste}
                  onChange={(e) =>
                    setNovo({ ...novo, sistemaAjuste: e.target.value })
                  }
                  className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="SIAPE">SIAPE</option>
                  <option value="SIGEPE AJ">SIGEPE AJ</option>
                  <option value="SIGEPE">SIGEPE</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!novo.data || !novo.processo || !novo.minutos || submitting}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar registro
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
