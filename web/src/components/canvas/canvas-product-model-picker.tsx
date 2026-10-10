import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Popover } from "antd";
import { Check, ChevronDown } from "lucide-react";

import { modelCapabilityConfigFor } from "@/lib/model-capabilities";
import { modelCompatibilityError, resolveCompatibleModel, type ModelRequirements } from "@/lib/model-selection";
import { cn } from "@/lib/utils";
import { modelDisplayName, modelIcon, modelOptionName, resolveModelChannel, selectableModelsByCapability, type AiConfig, type ModelCapability } from "@/stores/use-config-store";
import { ModelLogo } from "@/components/model-logo";

import "./canvas-product-model-picker.css";

type CanvasProductModelPickerProps = {
    config: AiConfig;
    value?: string;
    onChange: (model: string) => void;
    capability?: ModelCapability;
    requirements?: ModelRequirements;
    className?: string;
    placeholder?: string;
    fullWidth?: boolean;
    onMissingConfig?: () => void;
};

/** 二开创作台模型选择器：模型直接平铺展示，不经过源仓库的厂商/模型两级菜单。 */
export function CanvasProductModelPicker({ config, value, onChange, capability, requirements, className, placeholder = "选择模型", fullWidth = false, onMissingConfig }: CanvasProductModelPickerProps) {
    const [open, setOpen] = useState(false);
    const rawOptions = useMemo(() => selectableModelsByCapability(config, capability).filter(Boolean), [capability, config]);
    // 保留完整的 channel::model 选择值，不能按展示名称去重：同名自定义模型
    // 与系统模型的路由不同，去重会导致视频任务丢失系统 channelId。
    const options = useMemo(
        () => [...rawOptions].sort((left, right) => Number(resolveModelChannel(config, right).scope === "system") - Number(resolveModelChannel(config, left).scope === "system")),
        [config, rawOptions],
    );
    const selectionRequirements = requirements ? { ...requirements, videoSeconds: undefined, imageSize: undefined, options: undefined } : undefined;
    const resolved = resolveCompatibleModel(config, value?.trim() || "", selectionRequirements) || value?.trim() || "";
    const current = options.includes(resolved) ? resolved : options.find((model) => modelOptionName(model) === modelOptionName(resolved)) || "";
    const currentLabel = current ? modelDisplayName(config, current) : placeholder;

    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest(".canvas-product-model-picker") || event.target.closest(".canvas-product-model-picker-popover")) return;
            setOpen(false);
        };
        window.addEventListener("pointerdown", close, true);
        return () => window.removeEventListener("pointerdown", close, true);
    }, [open]);

    const setPickerOpen = (next: boolean) => {
        if (next && !options.length) onMissingConfig?.();
        setOpen(next);
    };
    const choose = (model: string) => {
        onChange(model);
        setOpen(false);
    };

    const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-product-model-item]:not(:disabled)"));
        if (!items.length) return;
        event.preventDefault();
        const active = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowUp" ? Math.max(0, active - 1) : Math.min(items.length - 1, active + 1);
        items[next]?.focus();
    };

    const content = (
        <div className="canvas-product-model-picker-menu" role="listbox" aria-label={placeholder} onKeyDown={onMenuKeyDown}>
            <div className="canvas-product-model-picker-models">
            {options.map((model) => {
                const selected = model === current;
                const channel = config.channels.find((item) => item.id === model.split("::")[0]);
                const cost = channel?.modelCosts?.find((item) => item.model === modelOptionName(model));
                const disabledReason = modelCompatibilityError(config, model, selectionRequirements);
                const subtitle = disabledReason || cost?.description?.trim() || (capability === "image" ? "通用图片模型，提示词理解稳定" : capability === "video" ? "通用视频模型，支持参考内容" : capability === "text" ? "通用文本模型，适合日常创作" : "通用创作模型");
                return (
                    <button key={model} type="button" data-product-model-item role="option" aria-selected={selected} disabled={Boolean(disabledReason)} className={cn("canvas-product-model-picker-option", selected && "is-selected")} onClick={() => choose(model)}>
                        <span className="canvas-product-model-picker-icon"><ModelLogo icon={modelIcon(config, model)} size={18} /></span>
                        <span className="canvas-product-model-picker-copy"><div className="canvas-product-model-picker-copy-title">{modelDisplayName(config, model)}</div><div  className="canvas-product-model-picker-copy-dec">{subtitle}</div></span>
                        {selected ? <Check className="canvas-product-model-picker-check" aria-hidden="true" /> : null}
                    </button>
                );
            })}
            {!options.length ? <span className="canvas-product-model-picker-empty">暂无可用模型</span> : null}
            </div>
        </div>
    );

    return (
        <Popover open={open} onOpenChange={setPickerOpen} trigger="click" placement="topLeft" arrow={false} content={content} classNames={{ root: "canvas-product-model-picker-popover", container: "canvas-product-model-picker-surface", content: "canvas-product-model-picker-content" }}>
            <button type="button" className={cn("canvas-product-model-picker", fullWidth && "w-full", className)} aria-haspopup="listbox" aria-expanded={open} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "Enter") { event.preventDefault(); setPickerOpen(true); } }}>
                <span className="canvas-product-model-picker-trigger-icon"><ModelLogo icon={current ? modelIcon(config, current) : undefined} size={16} /></span>
                <span className="canvas-product-model-picker-trigger-label">{currentLabel}</span>
                <ChevronDown className={cn("canvas-product-model-picker-trigger-arrow", open && "is-open")} aria-hidden="true" />
            </button>
        </Popover>
    );
}
