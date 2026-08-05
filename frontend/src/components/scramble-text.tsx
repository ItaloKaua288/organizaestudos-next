"use client";

import { useEffect, useState } from "react";

interface ScrambleTextProps {
    text: string;
    className?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function ScrambleText({ text, className }: ScrambleTextProps) {
    const [displayedText, setDisplayedText] = useState(text);

    useEffect(() => {
        let iteration = 0;

        const interval = setInterval(() => {
            setDisplayedText((current) =>
                current
                    .split("")
                    .map((letter, index) => {
                        if (letter === " ") return " ";

                        if (index < iteration) {
                            return text[index];
                        }

                        return LETTERS[Math.floor(Math.random() * 26)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(interval);
            }

            iteration += 1 / 3;
        }, 35); 

        return () => clearInterval(interval);
    }, [text]);

    return <span className={className}>{displayedText}</span>;
};

export default ScrambleText;