"use client"

import { DialogDemo } from "@/components/dialog-button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { useState } from "react";
import SubjectBox from "@/components/subject-box";

export default function MateriasPage() {
    const [color, setColor] = useState("#3b82f6") 
    const [name, setName] = useState("")

    const exempleSubjects = [
        { id: "1", name: "Matéria 1", color: "#3b82f6" , topics: [
            { id: "1", title: "Assunto 1", status: "PENDENTE" as const, description: "Descrição do assunto 1", attachments: [
                { id: "1", name: "Anexo 1", url: undefined, file: undefined },
            ]},
            { id: "2", title: "Assunto 2", status: "CONCLUIDO" as const, description: "Descrição do assunto 2", attachments: [
                { id: "1", name: "Anexo 1", url: "https://example.com/anexo1.pdf", file: undefined },
                { id: "2", name: "Anexo 2", url: undefined, file: undefined },
            ]},
            { id: "3", title: "Assunto 3", status: "PENDENTE" as const, description: "Descrição do assunto 3", attachments: [
                { id: "1", name: "Anexo 1", url: undefined, file: undefined },
            ]},
        ]},
        { id: "2", name: "Matéria 2", color: "#ef4444" , topics: [
            { id: "4", title: "Assunto 4", status: "PENDENTE" as const, description: "Descrição do assunto 4", attachments: [
                { id: "1", name: "Anexo 1", url: undefined, file: undefined },
                { id: "2", name: "Anexo 2", url: undefined, file: undefined },
            ]},
            { id: "5", title: "Assunto 5", status: "CONCLUIDO" as const, description: "Descrição do assunto 5", attachments: [
                { id: "1", name: "Anexo 1", url: undefined, file: undefined },
                { id: "2", name: "Anexo 2", url: undefined, file: undefined },
            ]},
        ]},
        { id: "3", name: "Matéria 3", color: "#facc15" , topics: [
            { id: "6", title: "Assunto 6", status: "PENDENTE" as const, description: "Descrição do assunto 6", attachments: []},
        ]},
    ];
  
    return (
        <div className="flex flex-col min-h-screen">
            <h1 className="px-2 text-xl font-bold shadow-sm bg-card">Matérias</h1>
            <div className="flex items-center gap-3 justify-between p-2">
                <p className="font-medium">Gerencie suas matérias e assuntos</p>
                <DialogDemo 
                    nameBtn="Nova Matéria" 
                    title="Nova Matéria" 
                    description="Crie uma nova matéria para organizar seus estudos." 
                    nameConfirmBtn="Criar Matéria"
                >
                    <FieldGroup>
                        <Field>
                            <Label htmlFor="name-1">Nome:</Label>
                            <Input id="name-1" name="name" placeholder="Nome da matéria" value={name} onChange={(e) => setName(e.target.value)} />
                        </Field>
                        <Field>
                            <Label htmlFor="description-1">Escolha uma cor:</Label>
                            <ColorPicker value={color} onChange={setColor} />
                        </Field>
                    </FieldGroup>
                </DialogDemo>
            </div>
            <div className="px-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
                {exempleSubjects.map((subject) => (
                    <SubjectBox key={subject.id} subject={subject.name} color={subject.color} topics={subject.topics } />
                ))}
            </div>
        </div>
    );
}