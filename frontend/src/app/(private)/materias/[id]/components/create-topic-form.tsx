"use client"

import { createTopicAction } from "@/actions/topics.actions"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
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