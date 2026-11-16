"use client";

import { useNavPrefs } from "@/components/nav-prefs-provider";
import { Button } from "@/components/ui/button";
import { DEFAULT_PREFS } from "@/lib/layout-preference";
import { cn } from "@/lib/utils";
import {
    AlignCenter,
    Maximize2,
    Minimize2,
    PanelLeft,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRight,
    PanelTop,
    RotateCcw,
    Rows2,
    Rows3,
    type LucideIcon,
} from "lucide-react";

type Option<T extends string> = { value: T; label: string; description: string; icon: LucideIcon };

/** Grupo de opções excludentes (radio) em cartões. */
function OptionGroup<T extends string>({
    title,
    description,
    value,
    options,
    onChange,
    columns = "sm:grid-cols-2",
}: {
    title: string;
    description?: string;
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
    columns?: string;
}) {
    const labelId = `appearance-${title.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <div className="space-y-3">
            <div className="space-y-0.5">
                <h3 id={labelId} className="text-sm font-medium">
                    {title}
                </h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>

            <div role="radiogroup" aria-labelledby={labelId} className={cn("grid gap-3", columns)}>
                {options.map(({ value: optionValue, label, description: optionDescription, icon: Icon }) => {
                    const selected = value === optionValue;
                    return (
                        <button
                            key={optionValue}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(optionValue)}
                            className={cn(
                                "flex items-start gap-3 rounded-2xl p-4 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                selected ? "bg-primary/10 ring-2 ring-primary" : "bg-foreground/4 ring-1 ring-(--glass-ring) hover:bg-foreground/8"
                            )}
                        >
                            <Icon className={cn("mt-0.5 size-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                            <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-sm font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">{optionDescription}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** Aparência do site: layout de navegação, lado e estado da sidebar, densidade e largura do conteúdo. */
export function LayoutForm() {
    const { prefs, update } = useNavPrefs();
    const isDefault = (Object.keys(DEFAULT_PREFS) as (keyof typeof DEFAULT_PREFS)[]).every((key) => prefs[key] === DEFAULT_PREFS[key]);

    return (
        <section aria-labelledby="layout-title" className="glass flex flex-col gap-7 rounded-3xl p-5 sm:p-7">
            <div className="space-y-1">
                <h2 id="layout-title" className="text-lg font-medium">
                    Aparência
                </h2>
                <p className="text-sm text-muted-foreground">
                    As mudanças valem na hora e ficam salvas neste navegador. No celular e em telas pequenas o menu continua na barra inferior.
                </p>
            </div>

            <OptionGroup
                title="Layout do site"
                value={prefs.layout}
                onChange={(layout) => update({ layout })}
                options={[
                    { value: "top", label: "Barra no topo", description: "Menu central flutuante, como é hoje.", icon: PanelTop },
                    { value: "sidebar", label: "Menu lateral", description: "Sidebar fixa e sem a barra central.", icon: PanelLeft },
                ]}
            />

            {prefs.layout === "sidebar" && (
                <>
                    <OptionGroup
                        title="Lado da sidebar"
                        value={prefs.side}
                        onChange={(side) => update({ side })}
                        options={[
                            { value: "left", label: "Esquerda", description: "Menu à esquerda do conteúdo.", icon: PanelLeft },
                            { value: "right", label: "Direita", description: "Menu à direita do conteúdo.", icon: PanelRight },
                        ]}
                    />

                    <OptionGroup
                        title="Tamanho da sidebar"
                        description="Também dá para recolher pelo botão no topo da própria sidebar."
                        value={prefs.collapsed ? "collapsed" : "expanded"}
                        onChange={(value) => update({ collapsed: value === "collapsed" })}
                        options={[
                            { value: "expanded", label: "Expandida", description: "Ícones e nomes das telas.", icon: PanelLeftOpen },
                            { value: "collapsed", label: "Recolhida", description: "Só ícones, com mais espaço para o conteúdo.", icon: PanelLeftClose },
                        ]}
                    />
                </>
            )}

            <OptionGroup
                title="Densidade"
                description="A compacta reduz textos e espaços para caber mais coisa na tela."
                value={prefs.density}
                onChange={(density) => update({ density })}
                options={[
                    { value: "comfortable", label: "Confortável", description: "Espaçamento padrão.", icon: Rows2 },
                    { value: "compact", label: "Compacta", description: "Tudo um pouco menor.", icon: Rows3 },
                ]}
            />

            <OptionGroup
                title="Largura do conteúdo"
                value={prefs.width}
                onChange={(width) => update({ width })}
                columns="sm:grid-cols-3"
                options={[
                    { value: "narrow", label: "Estreita", description: "Leitura mais focada.", icon: Minimize2 },
                    { value: "default", label: "Padrão", description: "Largura atual.", icon: AlignCenter },
                    { value: "wide", label: "Ampla", description: "Aproveita telas grandes.", icon: Maximize2 },
                ]}
            />

            <Button type="button" variant="outline" disabled={isDefault} onClick={() => update(DEFAULT_PREFS)} className="self-start">
                <RotateCcw /> Redefinir para o padrão
            </Button>
        </section>
    );
}
