"use client"

import { createTopicAction } from "@/actions/topics.actions"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2, Plus } from "lucide-react"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

export function CreateTopicForm({ subjectId }: { subjectId: string }) {
    const [isPending, setIsPending] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    async function handleAction(formData: FormData) {
        setIsPending(true)

        try {
            toast.loading("Criando...", { id: "topic-create" })
            await createTopicAction(formData, subjectId)
            toast.success("Assunto criado com sucesso!", { id: "topic-create" })
            formRef.current?.reset()
        } catch {
            toast.error("Falha ao criar o assunto.", { id: "topic-create" })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form action={handleAction} ref={formRef}>
            <Field className="flex flex-row gap-2 mt-4">
                <Input
                    name="title"
                    required
                    className="dark:bg-input/30 bg-input/10"
                    placeholder="Adicione um assunto"
                    disabled={isPending}
                />
                <Button
                    type="submit"
                    variant="outline"
                    className="max-w-10 dark:bg-input/30 bg-input/10"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={15} />}
                </Button>
            </Field>
        </form>
    )
}