"use client";

import { Button } from "@/components/ui/button";
import { Subject } from "@/types/subject";
import Link from "next/link";
import toast from "react-hot-toast";


export function RedirectButton({ subject, index }: {  subject: Subject, index: number }) {
    
    return (
        <Button
            key={subject.id}
            variant="outline"
            className="h-auto justify-start p-6 antiTransparenceBtn introduction-card"
            nativeButton={false}
            style={{ animationDelay: `${index * 150}ms` }}
            onClick={() => {
                sessionStorage.setItem("showRedirectToast", "true");
                toast.loading("Redirecionando...", {
                    id: "redirect"
                });           
            }}
            render={
                <Link href={`/notas/${subject.id}`} className="flex gap-2 items-center" >
                    <span
                        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                    />
                    <span className="truncate font-medium">{subject.title}</span>
                </Link>
            }
        />
    );
}