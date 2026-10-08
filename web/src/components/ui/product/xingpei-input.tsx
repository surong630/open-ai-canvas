import { ConfigProvider, Input, type InputProps, type InputRef } from "antd";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import "./xingpei-input.css";

const xingpeiInputTheme = {
    token: {
        colorBgContainer: "#2C2C2C",
        colorBorder: "#272727",
        colorPrimary: "#A998FF",
        colorText: "#FFFFFF",
        colorTextPlaceholder: "#818181",
        borderRadius: 10,
    },
    components: {
        Input: {
            activeBg: "#2C2C2C",
            activeBorderColor: "#A998FF",
            activeShadow: "none",
            hoverBg: "#2C2C2C",
            hoverBorderColor: "#3A3A3A",
        },
    },
} as const;

export const XingpeiInput = forwardRef<InputRef, InputProps>(function XingpeiInput({ className, rootClassName, ...props }, ref) {
    return (
        <ConfigProvider theme={xingpeiInputTheme}>
            <Input
                ref={ref}
                {...props}
                className={cn("xingpei-input", className)}
                rootClassName={cn("xingpei-input-root", rootClassName)}
            />
        </ConfigProvider>
    );
});
