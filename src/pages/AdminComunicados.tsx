import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useComunicados,
  formatNumeroComunicado,
  type Comunicado,
  type ComunicadoInput,
} from "@/hooks/use-comunicados";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Megaphone, ExternalLink, Pencil, Trash2 } from "lucide-react";

const DEFAULT_AUTOR = "Produtividade, Dados e Comunicação/CGRIS";

export default function AdminComunicados() {
  const { isAdmin, profile, loading: authLoading } = useAuth();
  const { comunicados, loading, save, remove } = useComunicados();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Comunicado | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const proximoNumero = useMemo(() => {
    const ano = new Date().getFullYear();
    const doAno = comunicados.filter((c) => c.ano === ano);
    const max = doAno.reduce((acc, c) => Math.max(acc, c.numero), 0);
    return { numero: max + 1, ano };
  }, [comunicados]);

  if (authLoading) return null;
  if (profile === null) return null;
  if (!isAdmin) return <Navigate to="/comunicados" replace />;

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (c: Comunicado) => {
    setEditing(c);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const ok = await remove(deletingId);
    if (ok) setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Admin
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Megaphone className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Comunicados</h1>
          <p className="text-sm text-muted-foreground">
            Cadastrar e editar comunicados oficiais ({comunicados.length} no total)
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Novo comunicado
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-muted-foreground py-4">Carregando...</p>
          ) : comunicados.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhum comunicado cadastrado. Clique em "Novo comunicado" para começar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Número</th>
                    <th className="pb-2 font-medium">Título</th>
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Drive</th>
                    <th className="pb-2 font-medium w-24">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {comunicados.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 whitespace-nowrap font-medium">
                        {String(c.numero).padStart(2, "0")}/{c.ano}
                      </td>
                      <td className="py-2">
                        <div className="font-medium">{c.titulo}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {c.resumo}
                        </div>
                      </td>
                      <td className="py-2 whitespace-nowrap text-muted-foreground">
                        {formatDate(c.data_publicacao)}
                      </td>
                      <td className="py-2">
                        <a
                          href={c.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir
                        </a>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ComunicadoEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        comunicado={editing}
        proximoNumero={proximoNumero}
        onSave={save}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comunicado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o registro do banco. O arquivo no Drive não é
              afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Modal de cadastro / edição
// ============================================================
function ComunicadoEditModal({
  open,
  onOpenChange,
  comunicado,
  proximoNumero,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  comunicado: Comunicado | null;
  proximoNumero: { numero: number; ano: number };
  onSave: (input: ComunicadoInput) => Promise<boolean>;
}) {
  const isEdit = !!comunicado;
  const [numero, setNumero] = useState("");
  const [ano, setAno] = useState("");
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [dataPub, setDataPub] = useState("");
  const [autor, setAutor] = useState(DEFAULT_AUTOR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (comunicado) {
      setNumero(String(comunicado.numero));
      setAno(String(comunicado.ano));
      setTitulo(comunicado.titulo);
      setResumo(comunicado.resumo);
      setDriveUrl(comunicado.drive_url);
      setDataPub(comunicado.data_publicacao);
      setAutor(comunicado.autor_setor);
    } else {
      setNumero(String(proximoNumero.numero));
      setAno(String(proximoNumero.ano));
      setTitulo("");
      setResumo("");
      setDriveUrl("");
      setDataPub(new Date().toISOString().slice(0, 10));
      setAutor(DEFAULT_AUTOR);
    }
  }, [open, comunicado, proximoNumero]);

  const handleSubmit = async () => {
    const numeroInt = parseInt(numero, 10);
    const anoInt = parseInt(ano, 10);
    if (!numeroInt || numeroInt < 1) {
      return;
    }
    if (!anoInt || anoInt < 2020) {
      return;
    }
    setSaving(true);
    const ok = await onSave({
      id: comunicado?.id ?? null,
      numero: numeroInt,
      ano: anoInt,
      titulo,
      resumo,
      drive_url: driveUrl,
      data_publicacao: dataPub,
      autor_setor: autor,
    });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const valid =
    numero.trim() !== "" &&
    ano.trim() !== "" &&
    titulo.trim() !== "" &&
    resumo.trim() !== "" &&
    driveUrl.trim() !== "" &&
    /^https?:\/\//i.test(driveUrl.trim()) &&
    dataPub.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Editar ${formatNumeroComunicado(comunicado!)}`
              : "Novo comunicado"}
          </DialogTitle>
          <DialogDescription>
            Cadastre o número, título e link do arquivo no Drive. O resumo
            aparece na home e na lista para os servidores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Número *</Label>
              <Input
                type="number"
                min={1}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div>
              <Label>Ano *</Label>
              <Input
                type="number"
                min={2020}
                max={2100}
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              />
            </div>
            <div>
              <Label>Data publicação *</Label>
              <Input
                type="date"
                value={dataPub}
                onChange={(e) => setDataPub(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Convite – Encontro Nacional de Gestão de Pessoas SIPEC 2026"
            />
          </div>
          <div>
            <Label>Resumo *</Label>
            <Textarea
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={3}
              placeholder="1 ou 2 frases que aparecem no card."
            />
          </div>
          <div>
            <Label>Link no Drive *</Label>
            <Input
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div>
            <Label>Setor autor</Label>
            <Input value={autor} onChange={(e) => setAutor(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!valid || saving} onClick={handleSubmit}>
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
