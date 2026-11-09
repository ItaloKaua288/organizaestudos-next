"use client"

import { createTopicAction } from "@/actions/topics.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { describeFailure, toastError } from "@/lib/toast-feedback"
import { Loader2, Plus } from "lucide-react"
import { NEW_ITEM_EVENT, type NewItemEventDetail } from "@/lib/shortcut-events"
import { useActionState, useEffect, useRef } from "react"
import toast from "react-hot-toast"

export function CreateTopicForm({ subjectId }: { subjectId: string }) {
    const formRef = useRef<HTMLFormElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Atalho "N": leva o cursor ao campo de novo assunto.
    useEffect(() => {
        const onNewItem = (event: Event) => {
            const detail = (event as CustomEvent<NewItemEventDetail>).detail
            if (detail) detail.handled = true
            inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
            inputRef.current?.focus()
        }

        window.addEventListener(NEW_ITEM_EVENT, onNewItem)
        return () => window.removeEventListener(NEW_ITEM_EVENT, onNewItem)
    }, [])

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
                toastError(describeFailure("Não foi possível criar o assunto", result?.message), { id: "topic-create" })
            }
            return result;
        } catch (error) {
            toastError(describeFailure("Erro ao criar o assunto", error), { id: "topic-create" })
            return { success: false }
        }
    }, null);

    return (
        <form action={formAction} ref={formRef}>
            <div className="mt-3 flex items-center gap-2">
                <Input
                    ref={inputRef}
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