"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

export function CloseRedirectToast() {
    useEffect(() => {
        const shouldShow = sessionStorage.getItem("showRedirectToast");

        if (shouldShow === "true") {
            toast.success("Redirecionado!", {
                id: "redirect",
            });

            sessionStorage.removeItem("showRedirectToast");
        }
    }, []);

    return null;
}