import { ConfigProvider } from "antd";
import AntSelect, {
    type BaseOptionType,
    type DefaultOptionType,
    type RefSelectProps,
    type SelectProps as AntSelectProps,
} from "antd/es/select";
import { ChevronDown } from "lucide-react";
import { forwardRef, type ReactElement, type RefAttributes } from "react";

import { cn } from "@/lib/utils";

import "./xingpei-select.css";

export type XingpeiSelectProps<
    ValueType = unknown,
    OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = Omit<AntSelectProps<ValueType, OptionType>, "classNames" | "popupClassName"> & {
    popupClassName?: string;
};

type XingpeiSelectComponent = <
    ValueType = unknown,
    OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(
    props: XingpeiSelectProps<ValueType, OptionType> & RefAttributes<RefSelectProps>,
) => ReactElement;

const xingpeiSelectTheme = {
    token: {
        colorBgElevated: "#2C2C2C",
        colorBorder: "#272727",
        colorPrimary: "#FFFFFF",
        colorText: "#FFFFFF",
        colorTextPlaceholder: "#818181",
        borderRadius: 10,
        borderRadiusLG: 10,
    },
    components: {
        Select: {
            selectorBg: "#2C2C2C",
            clearBg: "#2C2C2C",
            hoverBorderColor: "#3A3A3A",
            activeBorderColor: "#4A4A4A",
            activeOutlineColor: "transparent",
            optionActiveBg: "#3A3A3A",
            optionSelectedBg: "#444444",
            optionSelectedColor: "#FFFFFF",
            optionHeight: 32,
        },
    },
} as const;

export const XingpeiSelect = forwardRef<RefSelectProps, XingpeiSelectProps>(function XingpeiSelect(
    { className, popupClassName, suffixIcon, ...props },
    ref,
) {
    return (
        <ConfigProvider theme={xingpeiSelectTheme}>
            <AntSelect
                ref={ref}
                {...props}
                suffixIcon={suffixIcon ?? <ChevronDown aria-hidden size={14} strokeWidth={1.8} />}
                className={cn("xingpei-select", className)}
                classNames={{ popup: { root: cn("xingpei-select-popup", popupClassName) } }}
            />
        </ConfigProvider>
    );
}) as XingpeiSelectComponent;
