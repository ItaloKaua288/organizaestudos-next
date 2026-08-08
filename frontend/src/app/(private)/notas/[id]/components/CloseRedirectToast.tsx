"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

export function CloseRedirectToast() {
    useEffect(() => {
        toast.dismiss("redirect");
    }, []);

    return null;
}