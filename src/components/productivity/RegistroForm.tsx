import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, Plus, HelpCircle } from "lucide-react";
import type {
  Registro,
  CpfHistoryResult,
  ProcessoLastJudicial,
} from "@/types/registro";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { formatSei, isValidSei } from "@/lib/sei";
import {
  getAssuntosByTipo,
  FAIXAS_MULTA,
  AREAS_ENCAMINHAMENTO,
  AREAS_ENCAMINHAMENTO_ATOS,
  FAIXAS_ACAO_COLETIVA,
  FAIXAS_LOTE_INDICIOS,
} from "@/lib/judicial-options";

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
  tipoAto: "",
  subtipoAto: "",
  cpf: "",
  assuntoJudicial: "",
  assuntoJudicialOutros: "",
  multa: false,
  multaDestinatario: "",
  multaPeriodicidade: "",
  multaFaixa: "",
  encaminhadoPara: [],
  encaminhadoParaOutros: "",
  trilha: "",
  acaoColetivaFaixa: "",
  loteIndiciosFaixa: "",
  motivoTempo: "",
  numPaginas: "",
  assunto: "",
  familiaridade: "",
  outroMotivo: "",
};

const SUBTIPOS_ATO: Record<string, { v: string; l: string }[]> = {
  pensao: [
    { v: "nova_concessao", l: "Nova concessão" },
    { v: "revisao", l: "Revisão" },
    { v: "diligencia", l: "Diligência" },
    { v: "devolucao", l: "Devolução" },
    { v: "judicial", l: "Judicial" },
  ],
  aposentadoria: [
    { v: "nova_concessao", l: "Nova concessão" },
    { v: "revisao", l: "Revisão" },
    { v: "diligencia", l: "Diligência" },
    { v: "devolucao", l: "Devolução" },
    { v: "judicial", l: "Judicial" },
  ],
  administrativo: [
    { v: "levantamento_indicador", l: "Levantamento de indicador" },
    { v: "busca_processo", l: "Busca de processo" },
    { v: "triagem_planilha", l: "Triagem de planilha" },
    { v: "anexo_diligencia", l: "Anexo de diligência" },
  ],
};

const ENTREGAS = [
  "Nota informativa",
  "Nota Tecnica",
  "Oficio",
  "Despacho",
  "Memoria de calculo",
  "Ajuste no sistema",
];

type Props = {
  onSubmit: (registro: Registro) => void;
  submitting?: boolean;
  onCpfCheck?: (cpf: string) => Promise<CpfHistoryResult | null>;
  onProcessoLookup?: (
    processo: string
  ) => Promise<ProcessoLastJudicial | null>;
};

export default function RegistroForm({
  onSubmit,
  submitting,
  onCpfCheck,
  onProcessoLookup,
}: Props) {
  const [open, setOpen] = useState(true);
  const [novo, setNovo] = useState<Registro>({ ...EMPTY });
  const [cpfHistory, setCpfHistory] = useState<CpfHistoryResult | null>(null);
  const [assuntoSugerido, setAssuntoSugerido] = useState<boolean>(false);

  const cpfDigits = onlyDigits(novo.cpf ?? "");
  const cpfTouched = cpfDigits.length > 0;
  const cpfValid = cpfDigits.length === 0 || isValidCpf(cpfDigits);

  const processoTouched = (novo.processo ?? "").length > 0;
  const processoValid = isValidSei(novo.processo ?? "");

  useEffect(() => {
    if (!onCpfCheck || cpfDigits.length !== 11 || !cpfValid) {
      setCpfHistory(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await onCpfCheck(cpfDigits);
      if (!cancelled) setCpfHistory(r);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [cpfDigits, cpfValid, onCpfCheck]);

  const handleSubmit = () => {
    if (!novo.data || !novo.processo || !novo.minutos) return;
    if (cpfTouched && !cpfValid) return;
    if (!processoValid) return;
    onSubmit({ ...novo, cpf: cpfDigits || undefined });
    setNovo({ ...EMPTY });
    setCpfHistory(null);
    setAssuntoSugerido(false);
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
                  tipoAto: "",
                  subtipoAto: "",
                  assuntoJudicial: "",
                  assuntoJudicialOutros: "",
                  multa: false,
                  multaDestinatario: "",
                  multaPeriodicidade: "",
                  multaFaixa: "",
                  trilha: "",
                })
              }
              className="w-full border rounded-md h-10 px-3 bg-background text-sm"
            >
              <option value="">Selecione</option>
              <option value="judicial">Judicial</option>
              <option value="controle">Controle</option>
              <option value="atos">Atos de pessoal</option>
            </select>
          </div>

          {novo.tipoNatureza === "judicial" && (
            <div>
              <Label>Tipo de processo</Label>
              <select
                value={novo.tipoProcesso}
                onChange={(e) =>
                  setNovo({
                    ...novo,
                    tipoProcesso: e.target.value,
                    assuntoJudicial: "",
                    assuntoJudicialOutros: "",
                  })
                }
                className="w-full border rounded-md h-10 px-3 bg-background text-sm"
              >
                <option value="">Selecione</option>
                <option value="subsidio">Subsidio</option>
                <option value="cumprimento">Cumprimento</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </div>
          )}

          {novo.tipoNatureza === "controle" && (
            <>
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
              <div>
                <Label>Trilha</Label>
                <Input
                  list="trilhas-sugestoes"
                  placeholder="Nome da trilha"
                  value={novo.trilha || ""}
                  onChange={(e) => setNovo({ ...novo, trilha: e.target.value })}
                />
                <datalist id="trilhas-sugestoes" />
              </div>
            </>
          )}

          {novo.tipoNatureza === "atos" && (
            <>
              <div>
                <Label>Tipo de ato</Label>
                <select
                  value={novo.tipoAto}
                  onChange={(e) =>
                    setNovo({ ...novo, tipoAto: e.target.value, subtipoAto: "" })
                  }
                  className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="pensao">Pensão</option>
                  <option value="aposentadoria">Aposentadoria</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>
              {novo.tipoAto && (
                <div>
                  <Label>Sub-tipo</Label>
                  <select
                    value={novo.subtipoAto}
                    onChange={(e) =>
                      setNovo({ ...novo, subtipoAto: e.target.value })
                    }
                    className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                  >
                    <option value="">Selecione</option>
                    {SUBTIPOS_ATO[novo.tipoAto]?.map((s) => (
                      <option key={s.v} value={s.v}>
                        {s.l}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="sm:col-span-2">
            <Label>Numero do processo ou indicio</Label>
            <Input
              inputMode="numeric"
              placeholder="00000.000000/0000-00"
              value={formatSei(novo.processo ?? "")}
              maxLength={20}
              aria-invalid={processoTouched && !processoValid}
              className={
                processoTouched && !processoValid ? "border-destructive" : ""
              }
              onChange={(e) =>
                setNovo({ ...novo, processo: formatSei(e.target.value) })
              }
              onBlur={async () => {
                if (
                  !onProcessoLookup ||
                  !novo.processo ||
                  !processoValid ||
                  novo.tipoNatureza !== "judicial" ||
                  novo.assuntoJudicial
                ) {
                  return;
                }
                const hist = await onProcessoLookup(novo.processo);
                if (!hist || !hist.assunto_judicial) return;
                setNovo((prev) => ({
                  ...prev,
                  tipoProcesso: prev.tipoProcesso || hist.tipo_processo || "",
                  assuntoJudicial:
                    prev.assuntoJudicial || hist.assunto_judicial || "",
                  assuntoJudicialOutros:
                    prev.assuntoJudicialOutros ||
                    hist.assunto_judicial_outros ||
                    "",
                }));
                setAssuntoSugerido(true);
              }}
            />
            {processoTouched && !processoValid && (
              <p className="text-xs text-destructive mt-1">
                Número incompleto. Formato SEI: 00000.000000/0000-00 (17
                dígitos).
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label>CPF (opcional)</Label>
            <Input
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={formatCpf(novo.cpf ?? "")}
              onChange={(e) => setNovo({ ...novo, cpf: e.target.value })}
              aria-invalid={cpfTouched && !cpfValid}
              className={cpfTouched && !cpfValid ? "border-destructive" : ""}
            />
            {cpfTouched && !cpfValid && (
              <p className="text-xs text-destructive mt-1">CPF inválido</p>
            )}
            {cpfHistory && cpfHistory.total_registros > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Este CPF já tem {cpfHistory.total_registros} registro
                {cpfHistory.total_registros === 1 ? "" : "s"} na sua equipe
                {cpfHistory.processos_distintos > 1 &&
                  ` em ${cpfHistory.processos_distintos} processos distintos`}
                {cpfHistory.ultimo_processo && (
                  <>
                    . Último: <strong>{cpfHistory.ultimo_processo}</strong>
                    {cpfHistory.ultimo_status && ` (${cpfHistory.ultimo_status})`}
                  </>
                )}
              </p>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={novo.status}
              onChange={(e) => {
                const v = e.target.value as Registro["status"];
                setNovo({
                  ...novo,
                  status: v,
                  encaminhadoPara: v === "Encaminhado" ? novo.encaminhadoPara : [],
                  encaminhadoParaOutros:
                    v === "Encaminhado" ? novo.encaminhadoParaOutros : "",
                });
              }}
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
                    { v: "acao_coletiva", l: "Ação coletiva" },
                    { v: "lote_indicios", l: "Análise em lote de indícios" },
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
                    <Label className="text-xs">
                      {novo.motivoTempo === "complexo"
                        ? "Detalhe a complexidade"
                        : "Detalhe a dificuldade"}
                    </Label>
                    <Input
                      placeholder={
                        novo.motivoTempo === "complexo"
                          ? "Ex: múltiplas decisões conflitantes, cálculos complexos"
                          : "Ex: primeira vez nesse tipo de processo"
                      }
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
                {novo.motivoTempo === "acao_coletiva" && (
                  <div className="ml-6">
                    <Label className="text-xs">Faixa de quantidade</Label>
                    <select
                      value={novo.acaoColetivaFaixa}
                      onChange={(e) =>
                        setNovo({
                          ...novo,
                          acaoColetivaFaixa: e.target.value,
                        })
                      }
                      className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                    >
                      <option value="">Selecione</option>
                      {FAIXAS_ACAO_COLETIVA.map((f) => (
                        <option key={f.v} value={f.v}>
                          {f.l}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {novo.motivoTempo === "lote_indicios" && (
                  <div className="ml-6">
                    <Label className="text-xs">Faixa de quantidade</Label>
                    <select
                      value={novo.loteIndiciosFaixa}
                      onChange={(e) =>
                        setNovo({
                          ...novo,
                          loteIndiciosFaixa: e.target.value,
                        })
                      }
                      className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                    >
                      <option value="">Selecione</option>
                      {FAIXAS_LOTE_INDICIOS.map((f) => (
                        <option key={f.v} value={f.v}>
                          {f.l}
                        </option>
                      ))}
                    </select>
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

          {novo.status === "Encaminhado" && (
            <div className="sm:col-span-4 grid gap-4 sm:grid-cols-2 p-4 border rounded-md bg-muted/20">
              <div>
                <Label>Encaminhado para</Label>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Marque uma ou mais áreas
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 border rounded-md p-3 bg-background">
                  {(novo.tipoNatureza === "atos"
                    ? AREAS_ENCAMINHAMENTO_ATOS
                    : AREAS_ENCAMINHAMENTO
                  ).map((a) => {
                    const checked = novo.encaminhadoPara?.includes(a.v) || false;
                    return (
                      <label
                        key={a.v}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const arr = novo.encaminhadoPara || [];
                            const next = e.target.checked
                              ? [...arr, a.v]
                              : arr.filter((v) => v !== a.v);
                            setNovo({
                              ...novo,
                              encaminhadoPara: next,
                              encaminhadoParaOutros: next.includes("outros")
                                ? novo.encaminhadoParaOutros
                                : "",
                            });
                          }}
                        />
                        {a.l}
                      </label>
                    );
                  })}
                </div>
              </div>
              {novo.encaminhadoPara?.includes("outros") && (
                <div>
                  <Label>Descreva a área</Label>
                  <Input
                    value={novo.encaminhadoParaOutros || ""}
                    onChange={(e) =>
                      setNovo({
                        ...novo,
                        encaminhadoParaOutros: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {novo.tipoNatureza === "judicial" && (
            <div className="sm:col-span-4 space-y-4 p-4 border rounded-md bg-muted/20">
              <h4 className="text-sm font-semibold">Detalhes judiciais</h4>

              {(novo.tipoProcesso === "subsidio" ||
                novo.tipoProcesso === "cumprimento" ||
                novo.tipoProcesso === "administrativo") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Assunto</Label>
                    <select
                      value={novo.assuntoJudicial}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (
                          v === "outros" &&
                          !window.confirm(
                            "Tem certeza que o assunto não está na lista?"
                          )
                        ) {
                          return;
                        }
                        setAssuntoSugerido(false);
                        setNovo({
                          ...novo,
                          assuntoJudicial: v,
                          assuntoJudicialOutros:
                            v === "outros" ? novo.assuntoJudicialOutros : "",
                        });
                      }}
                      className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                    >
                      <option value="">Selecione</option>
                      {getAssuntosByTipo(novo.tipoProcesso).map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.l}
                        </option>
                      ))}
                    </select>
                    {assuntoSugerido && novo.assuntoJudicial && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pré-preenchido pelo histórico deste processo. Pode
                        trocar se for outro assunto.
                      </p>
                    )}
                  </div>

                  {novo.assuntoJudicial === "outros" && (
                    <div>
                      <Label>Descreva o assunto</Label>
                      <Input
                        value={novo.assuntoJudicialOutros || ""}
                        onChange={(e) =>
                          setNovo({
                            ...novo,
                            assuntoJudicialOutros: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!novo.multa}
                    onChange={(e) =>
                      setNovo({
                        ...novo,
                        multa: e.target.checked,
                        multaDestinatario: e.target.checked
                          ? novo.multaDestinatario
                          : "",
                        multaPeriodicidade: e.target.checked
                          ? novo.multaPeriodicidade
                          : "",
                        multaFaixa: e.target.checked ? novo.multaFaixa : "",
                      })
                    }
                  />
                  Houve aplicação de multa
                </label>

                {novo.multa && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label>Destinatário</Label>
                      <select
                        value={novo.multaDestinatario}
                        onChange={(e) =>
                          setNovo({ ...novo, multaDestinatario: e.target.value })
                        }
                        className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                      >
                        <option value="">Selecione</option>
                        <option value="uniao">União</option>
                        <option value="pessoal">Pessoal</option>
                      </select>
                    </div>
                    <div>
                      <Label>Periodicidade</Label>
                      <select
                        value={novo.multaPeriodicidade}
                        onChange={(e) =>
                          setNovo({
                            ...novo,
                            multaPeriodicidade: e.target.value,
                          })
                        }
                        className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                      >
                        <option value="">Selecione</option>
                        <option value="dia">Por dia</option>
                        <option value="total">Total</option>
                      </select>
                    </div>
                    <div>
                      <Label>Faixa de valor</Label>
                      <select
                        value={novo.multaFaixa}
                        onChange={(e) =>
                          setNovo({ ...novo, multaFaixa: e.target.value })
                        }
                        className="w-full border rounded-md h-10 px-3 bg-background text-sm"
                      >
                        <option value="">Selecione</option>
                        {FAIXAS_MULTA.map((f) => (
                          <option key={f.v} value={f.v}>
                            {f.l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sm:col-span-4">
            <Label>Documento ou acao</Label>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {ENTREGAS.map((doc) => {
                const isAjuste = doc === "Ajuste no sistema";
                const checkbox = (
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
                    {isAjuste && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Inclui ajustes via planilha
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </label>
                );
                return checkbox;
              })}
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
          disabled={
            !novo.data ||
            !novo.processo ||
            !novo.minutos ||
            (cpfTouched && !cpfValid) ||
            !processoValid ||
            submitting
          }
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar registro
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
