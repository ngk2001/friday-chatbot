"use client";

import { useEffect, useState } from "react";

const GLYPHS = "01#@$%&*<>[]{}ABCDEF";

interface CypherTextProps {
  text: string;
  className?: string;
}

export default function CypherText({ text, className = "" }: CypherTextProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return text[index];
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("")
      );

      iteration += 1.2;
      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{display}</span>;
}

