import { ConfigProvider, DatePicker } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";

import { cn } from "@/lib/utils";

import "./xingpei-range-picker.css";

export type XingpeiRangePickerProps = Omit<RangePickerProps, "classNames"> & {
    popupClassName?: string;
};

const xingpeiRangePickerTheme = {
    token: {
        colorBgContainer: "#2C2C2C",
        colorBgElevated: "#2C2C2C",
        colorBorder: "#272727",
        colorPrimary: "#FFFFFF",
        colorText: "#FFFFFF",
        colorTextPlaceholder: "#818181",
        borderRadius: 10,
        borderRadiusLG: 10,
    },
    components: {
        DatePicker: {
            activeBg: "#2C2C2C",
            activeBorderColor: "#4A4A4A",
            activeShadow: "none",
            hoverBg: "#2C2C2C",
            hoverBorderColor: "#3A3A3A",
        },
    },
} as const;

export function XingpeiRangePicker({ className, popupClassName, ...props }: XingpeiRangePickerProps) {
    return (
        <ConfigProvider theme={xingpeiRangePickerTheme}>
            <DatePicker.RangePicker
                {...props}
                className={cn("xingpei-range-picker", className)}
                classNames={{ popup: { root: cn("xingpei-range-picker-popup", popupClassName) } }}
            />
        </ConfigProvider>
    );
}
