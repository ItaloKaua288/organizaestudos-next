"use client";

import { Button } from "@/components/ui/button";
import { Subject } from "@/types/subject";
import Link from "next/link";
import toast from "react-hot-toast";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RedirectButton({ subject, index }: { subject: Subject, index?: number }) {
    
    return (
        <Button
            key={subject.id}
            variant="outline"
            className="h-auto justify-start rounded-2xl px-5 py-5"
            nativeButton={false}
            onClick={() => {
                sessionStorage.setItem("showRedirectToast", "true");
                toast.loading("Redirecionando...", {
                    id: "redirect"
                });           
            }}
            render={
                <Link href={`/notas/${subject.id}`} className="flex min-w-0 items-center gap-3" >
                    <span
                        className="inline-block size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                    />
                    <span className="truncate font-medium">{subject.title}</span>
                </Link>
            }
        />
    );
}