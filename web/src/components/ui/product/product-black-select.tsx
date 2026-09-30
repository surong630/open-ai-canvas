import { ConfigProvider } from "antd";
import AntSelect, {
    type BaseOptionType,
    type DefaultOptionType,
    type RefSelectProps,
    type SelectProps as AntSelectProps,
} from "antd/es/select";
import { ChevronDown } from "lucide-react";
import { forwardRef, type CSSProperties, type ReactElement, type RefAttributes } from "react";

import { cn } from "@/lib/utils";

const triggerClassName = [
    "product-black-select min-w-0! rounded-md! border! border-[#3a3a3a]! bg-[#252525]! shadow-none! [&:not(.ant-select-sm)]:min-h-9! [&.ant-select-sm]:min-h-8!",
    "hover:border-[#4b4b4b]! hover:bg-[#2b2b2b]!",
    "[&.ant-select-focused]:border-[#5a5a5a]! [&.ant-select-focused]:shadow-[0_0_0_2px_#ffffff12]!",
    "[&.ant-select-open]:border-[#5a5a5a]! [&.ant-select-open]:bg-[#2b2b2b]!",
    "[&.ant-select-disabled]:cursor-not-allowed [&.ant-select-disabled]:border-[#303030]! [&.ant-select-disabled]:bg-[#202020]! [&.ant-select-disabled]:opacity-55",
    "[&_.ant-select-selector]:border-0! [&_.ant-select-selector]:bg-transparent! [&_.ant-select-selector]:shadow-none!",
    "[&_.ant-select-selection-item]:text-[13px]! [&_.ant-select-selection-item]:text-[#f3f3f3]!",
    "[&_.ant-select-selection-placeholder]:text-[13px]! [&_.ant-select-selection-placeholder]:text-[#929292]!",
    "[&_.ant-select-selection-overflow]:gap-1",
    "[&_.ant-select-selection-overflow-item_.ant-select-selection-item]:m-0! [&_.ant-select-selection-overflow-item_.ant-select-selection-item]:rounded-sm! [&_.ant-select-selection-overflow-item_.ant-select-selection-item]:border-0! [&_.ant-select-selection-overflow-item_.ant-select-selection-item]:bg-[#3a3a3a]! [&_.ant-select-selection-overflow-item_.ant-select-selection-item]:px-1.5!",
    "[&_.ant-select-selection-item-remove]:text-[#a8a8a8]! [&_.ant-select-selection-item-remove:hover]:text-white!",
    "[&_.ant-select-clear]:bg-[#252525]! [&_.ant-select-clear]:text-[#999]! [&_.ant-select-clear:hover]:text-white!",
    "[&_.ant-select-arrow]:text-[#9b9b9b]! [&.ant-select-open_.ant-select-arrow]:rotate-180 [&_.ant-select-arrow]:transition-transform",
].join(" ");

const popupClassName = [
    "product-black-select-popup border! border-[#434343]! bg-[#303030]! p-1.5! shadow-[0_8px_24px_#00000066]!",
    "[&_.ant-select-item-option]:min-h-9! [&_.ant-select-item-option]:rounded-md! [&_.ant-select-item-option]:border-0! [&_.ant-select-item-option]:bg-transparent! [&_.ant-select-item-option]:px-2.5! [&_.ant-select-item-option]:py-2! [&_.ant-select-item-option]:text-[13px]! [&_.ant-select-item-option]:text-[#efefef]!",
    "[&_.ant-select-item-option-active:not(.ant-select-item-option-disabled)]:bg-[#414141]!",
    "[&_.ant-select-item-option-selected:not(.ant-select-item-option-disabled)]:bg-[#4a4a4a]! [&_.ant-select-item-option-selected:not(.ant-select-item-option-disabled)]:font-medium! [&_.ant-select-item-option-selected:not(.ant-select-item-option-disabled)]:text-white!",
    "[&_.ant-select-item-option-disabled]:text-[#777]!",
    "[&_.ant-select-item-empty]:py-5! [&_.ant-select-item-empty]:text-[13px]! [&_.ant-select-item-empty]:text-[#858585]!",
].join(" ");

const popupStyle = {
    "--popover": "#303030",
    "--popover-foreground": "#f3f3f3",
    "--r-2xl": "10px",
    "--elevation-overlay": "0 8px 24px #00000066",
} as CSSProperties;

const blackSelectTheme = {
    token: {
        colorBgElevated: "#303030",
        colorBorder: "#3a3a3a",
        colorPrimary: "#ffffff",
        colorText: "#f3f3f3",
        colorTextPlaceholder: "#929292",
        borderRadius: 6,
        borderRadiusLG: 10,
        boxShadowSecondary: "0 8px 24px #00000066",
    },
    components: {
        Select: {
            selectorBg: "#252525",
            clearBg: "#252525",
            hoverBorderColor: "#4b4b4b",
            activeBorderColor: "#5a5a5a",
            activeOutlineColor: "transparent",
            optionActiveBg: "#414141",
            optionSelectedBg: "#4a4a4a",
            optionSelectedColor: "#ffffff",
            optionSelectedFontWeight: 500,
            optionHeight: 36,
            optionPadding: "8px 10px",
            multipleItemBg: "#3a3a3a",
            multipleItemBorderColor: "transparent",
        },
    },
} as const;

export type ProductBlackSelectProps<
    ValueType = unknown,
    OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = Omit<AntSelectProps<ValueType, OptionType>, "classNames" | "popupClassName" | "styles"> & {
    popupClassName?: string;
};

type ProductBlackSelectComponent = <
    ValueType = unknown,
    OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(
    props: ProductBlackSelectProps<ValueType, OptionType> & RefAttributes<RefSelectProps>,
) => ReactElement;

export const ProductBlackSelect = forwardRef<RefSelectProps, ProductBlackSelectProps>(function ProductBlackSelect(
    { className, popupClassName: popupClassNameProp, suffixIcon, variant, ...props },
    ref,
) {
    return (
        <ConfigProvider theme={blackSelectTheme}>
            <AntSelect
                ref={ref}
                {...props}
                variant={variant ?? "filled"}
                suffixIcon={suffixIcon ?? <ChevronDown aria-hidden size={14} strokeWidth={1.8} />}
                className={cn(triggerClassName, className)}
                classNames={{ popup: { root: cn(popupClassName, popupClassNameProp) } }}
                styles={{ popup: { root: popupStyle } }}
            />
        </ConfigProvider>
    );
}) as ProductBlackSelectComponent;

