"use client";

import { ExportFormat, exportDataAction, importDataAction } from "@/actions/data.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImportSummary } from "@/types/data";
import { ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, FileJson } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

// Um pouco abaixo do limite da API (500 KB) para sobrar espaço do JSON de envio.
const MAX_FILE_BYTES = 400 * 1024;

function download(filename: string, content: string, format: ExportFormat) {
    const type = format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8";
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** Exporta/importa a estrutura de estudo (matérias, assuntos e subassuntos) em JSON ou CSV. */
export function DataTransfer() {
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [summary, setSummary] = useState<ImportSummary | null>(null);

    const handleOpenChange = (next: boolean) => {
        if (isBusy) return;
        setOpen(next);
        if (!next) setSummary(null);
    };

    const handleExport = async (format: ExportFormat) => {
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Gerando arquivo...", { id: "data-transfer" });

        try {
            const result = await exportDataAction(format);
            if (!result.success || !result.content || !result.filename) {
                toast.error(result.message ?? "Não foi possível exportar.", { id: "data-transfer" });
                return;
            }
            download(result.filename, result.content, format);
            toast.success("Arquivo exportado!", { id: "data-transfer" });
        } catch {
            toast.error("Erro ao exportar os dados.", { id: "data-transfer" });
        } finally {
            setIsBusy(false);
        }
    };

    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = ""; // permite escolher o mesmo arquivo de novo depois
        if (!file || isBusy) return;

        if (file.size > MAX_FILE_BYTES) {
            toast.error("Arquivo grande demais. O limite é de 400 KB.");
            return;
        }

        setIsBusy(true);
        setSummary(null);
        toast.loading("Importando...", { id: "data-transfer" });

        try {
            const result = await importDataAction(await file.text());
            if (!result.success) {
                toast.error(result.message, { id: "data-transfer" });
                return;
            }
            toast.success(result.message, { id: "data-transfer" });
            setSummary(result.summary ?? null);
            router.refresh();
        } catch {
            toast.error("Erro ao importar o arquivo.", { id: "data-transfer" });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} title="Exportar ou importar matérias e assuntos">
                <ArrowDownToLine size={15} /> <span className="max-sm:hidden">Exportar / Importar</span>
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Exportar e importar</DialogTitle>
                        <DialogDescription>
                            Leva só a estrutura: matérias, assuntos e subassuntos. Revisões, anexos, notas e questões não entram.
                        </DialogDescription>
                    </DialogHeader>

                    <section className="space-y-2">
                        <h3 className="text-sm font-semibold">Exportar</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleExport("json")} disabled={isBusy}>
                                <FileJson size={15} /> JSON (backup)
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={isBusy}>
                                <FileSpreadsheet size={15} /> CSV (planilha)
                            </Button>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-sm font-semibold">Importar</h3>
                        <p className="text-xs text-muted-foreground">
                            Aceita JSON ou CSV com as colunas <code>materia;cor;assunto;subassunto</code>. Matérias com o mesmo título
                            recebem só os assuntos novos, e tudo que entra começa como pendente.
                        </p>
                        <input ref={fileInput} type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={handleFile} aria-label="Arquivo para importar" />
                        <Button size="sm" onClick={() => fileInput.current?.click()} disabled={isBusy}>
                            <ArrowUpFromLine size={15} /> Escolher arquivo
                        </Button>

                        {summary && (
                            <ul className="space-y-0.5 rounded-md border p-2 text-sm" aria-live="polite">
                                <li>Matérias criadas: <strong>{summary.subjectsCreated}</strong></li>
                                <li>Matérias que já existiam (assuntos adicionados): <strong>{summary.subjectsMerged}</strong></li>
                                {summary.subjectsSkipped > 0 && (
                                    <li>Matérias desativadas ignoradas: <strong>{summary.subjectsSkipped}</strong></li>
                                )}
                                <li>Assuntos e subassuntos criados: <strong>{summary.topicsCreated}</strong></li>
                                <li>Já existiam e foram ignorados: <strong>{summary.topicsSkipped}</strong></li>
                            </ul>
                        )}
                    </section>
                </DialogContent>
            </Dialog>
        </>
    );
}
