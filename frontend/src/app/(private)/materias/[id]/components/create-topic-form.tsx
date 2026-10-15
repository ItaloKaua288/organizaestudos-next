"use client"

import { createTopicAction } from "@/actions/topics.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus } from "lucide-react"
import { useActionState, useRef } from "react"
import toast from "react-hot-toast"

export function CreateTopicForm({ subjectId }: { subjectId: string }) {
    const formRef = useRef<HTMLFormElement>(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        try {
            toast.loading("Criando...", { id: "topic-create" })
            formData.append("subject_id", subjectId)

            const result = await createTopicAction(formData)

            if (result?.success) {
                toast.success("Assunto criado com sucesso!", { id: "topic-create" })
                formRef.current?.reset()
            } else {
                toast.error(result?.message || "Falha ao criar o assunto.", { id: "topic-create" })
            }
            return result;
        } catch {
            toast.error("Erro crítico ao criar assunto.", { id: "topic-create" })
            return { success: false }
        }
    }, null);

    return (
        <form action={formAction} ref={formRef}>
            <div className="mt-3 flex items-center gap-2">
                <Input
                    name="title"
                    required
                    className="h-9 min-w-0 flex-1"
                    aria-label="Novo assunto"
                    placeholder="Novo assunto"
                    disabled={isPending}
                />
                <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Adicionar assunto"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={15} />}
                </Button>
            </div>
        </form>
    )
}