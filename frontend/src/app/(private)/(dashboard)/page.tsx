import { IconCard } from "@/components/icon-card";
import { BookOpen, ClipboardClock, BadgeCheck, Clock } from "lucide-react";
import ProgressLabelDemo from "@/components/progress-label";

export default function DashboardPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <h1 className="px-2 text-xl font-bold shadow-sm bg-card">Dashboard</h1>
            <div className="gap-4 py-2 px-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
                <IconCard variant="outline" title="Matérias" content="0" iconElement={<BookOpen />} />
                <IconCard variant="outline" title="Assuntos Pendentes" content="0" iconElement={<ClipboardClock />}/>
                <IconCard variant="outline" title="Assuntos Concluídos" content="0" iconElement={<BadgeCheck />}/>
                <IconCard variant="outline" title="Horas Estudadas" content="0" iconElement={<Clock />}/>
            </div>
            <div className="gap-4 py-2 px-2 grid grid-cols-1 md:grid-cols-1 w-full">
                <ProgressLabelDemo value={64} label="Progresso Geral" description="dos assuntos foram concluídos" />
            </div>
        </div>
    );
}
