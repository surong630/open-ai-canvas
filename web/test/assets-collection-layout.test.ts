import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("personal asset library", () => {
    test("uses the Lanhu header, mixed folder grid and asset action menu", () => {
        const page = readFileSync(resolve(import.meta.dir, "../src/pages/assets/index.tsx"), "utf8");
        const personalPage = readFileSync(resolve(import.meta.dir, "../src/pages/assets/personal-assets-page.tsx"), "utf8");
        const shell = readFileSync(resolve(import.meta.dir, "../src/pages/assets/product-assets-shell.tsx"), "utf8");
        const historyPage = readFileSync(resolve(import.meta.dir, "../src/pages/assets/asset-history-page.tsx"), "utf8");
        const blackSelect = readFileSync(resolve(import.meta.dir, "../src/components/ui/product/product-black-select.tsx"), "utf8");
        const sharedMenu = readFileSync(resolve(import.meta.dir, "../src/components/ui/product/product-card-more-menu.tsx"), "utf8");
        const sharedMenuCss = readFileSync(resolve(import.meta.dir, "../src/components/ui/product/product-card-more-menu.css"), "utf8");
        expect(page).toContain('from "./personal-assets-page"');
        expect(page).toContain("<PersonalAssetsPage");
        expect(personalPage).toContain("请选择标签进行搜索");
        expect(personalPage).toContain("请输入名称进行搜索");
        expect(personalPage).toContain("上传资产");
        expect(personalPage).toContain("新建文件夹");
        expect(personalPage).toContain("移动文件夹");
        expect(personalPage).toContain("设置标签");
        expect(personalPage).toContain('personalUploadIcon from "@/assets/product-assets/upload.svg"');
        expect(personalPage).toContain('personalFolderPlaceholder from "@/assets/product-assets/folder-placeholder.svg"');
        expect(personalPage).toContain('personalSelectionDelete from "@/assets/product-assets/selection-delete-design.svg"');
        expect(personalPage).toContain("grid-cols-[repeat(auto-fill,minmax(148px,1fr))]");
        expect(personalPage).toContain("w-[min(643px,calc(100%_-_48px))]");
        expect(personalPage.match(/w-0 min-w-0 flex-1 truncate/g)?.length).toBe(2);
        expect(personalPage).toContain("<ProductCardMoreMenu");
        expect(personalPage).toContain('popupClassName: "product-card-more-submenu"');
        expect(personalPage).toContain("<ProductBlackSelect");
        expect(personalPage).not.toContain('from "@/components/ui/base/select"');
        expect(blackSelect).toContain('"--popover": "#303030"');
        expect(blackSelect).toContain('classNames={{ popup: { root: cn(popupClassName, popupClassNameProp) } }}');
        expect(shell).toContain("grid-cols-[241px_minmax(0,1fr)]");
        expect(historyPage).toContain("grid-cols-[repeat(auto-fill,136px)]");
        expect(sharedMenu).toContain('rootClassName="product-card-more-menu"');
        expect(sharedMenu).toContain('className: "product-card-more-menu__list"');
        expect(sharedMenuCss).toMatch(/\.product-card-more-menu__list\.ant-dropdown-menu,[\s\S]*min-width:\s*151px/s);
        expect(sharedMenuCss).toContain("--workspace-overlay-bg-strong: var(--product-card-more-bg)");
        expect(sharedMenu).toContain('"--workspace-overlay-bg-strong": "#363636"');
    });

    test("keeps the save-folder select open when no folders exist", () => {
        const page = readFileSync(resolve(import.meta.dir, "../src/pages/assets/index.tsx"), "utf8");
        expect(page).toContain('value: "__empty_folder__"');
        expect(page).toContain('className="asset-save-dialog__empty-option">暂无文件夹');
        expect(page).toContain("options={folderOptions}");
        expect(page).toContain("disabled: true");
        expect(page.match(/<ProductBlackSelect/g)?.length).toBe(2);
        expect(page).not.toContain('classNames={{ popup: { root: "asset-save-dialog__popup" } }}');
    });

    test("uses the Lanhu media preview modal for image, video and audio assets", () => {
        const page = readFileSync(resolve(import.meta.dir, "../src/pages/assets/index.tsx"), "utf8");
        const modal = readFileSync(resolve(import.meta.dir, "../src/pages/assets/asset-image-preview-modal.tsx"), "utf8");
        const css = readFileSync(resolve(import.meta.dir, "../src/pages/assets/product-assets.css"), "utf8");
        expect(page).toContain("<AssetPreviewModal");
        expect(page).toContain('previewAsset.kind === "image" || previewAsset.kind === "video" || previewAsset.kind === "audio"');
        expect(modal).toContain('width="min(1208px, calc(100vw - 32px))"');
        expect(modal).toContain("asset-preview__stage--video");
        expect(modal).toContain("asset-preview__stage--audio");
        expect(modal).toContain('variant="original"');
        expect(modal).toContain("src={asset.data.dataUrl}");
        expect(modal).toContain('maxHeight: "100%"');
        expect(modal).toContain("asset-preview-empty@2x.png");
        expect(css).toMatch(/\.asset-preview\s*\{[^}]*height:\s*min\(608px,[^}]*grid-template-columns:\s*minmax\(0, 886px\) 322px/s);
        expect(css).toMatch(/\.asset-preview__header h2\s*\{[^}]*font-size:\s*14px[^}]*font-weight:\s*700/s);
        expect(css).toMatch(/\.asset-preview__facts dt,[\s\S]*color:\s*rgba\(145, 145, 145, 1\)[\s\S]*font-size:\s*14px/s);
        expect(css).toMatch(/\.asset-preview__stage--image > \.asset-preview__image,[\s\S]*max-height:\s*100% !important;[\s\S]*object-fit:\s*contain !important/s);
    });
});

describe("wallet history pagination", () => {
    test("pins ledger pagination to the history panel footer", () => {
        const modal = readFileSync(resolve(import.meta.dir, "../src/components/layout/workspace-wallet-modal.tsx"), "utf8");
        const css = readFileSync(resolve(import.meta.dir, "../src/styles/globals.css"), "utf8");
        expect(modal).toContain("workspace-wallet-history-scroll");
        expect(modal).toContain("workspace-wallet-pagination");
        expect(modal).not.toContain("wallet.total > 20");
        expect(css).toMatch(/\.workspace-wallet-content\.is-history\s*\{[^}]*overflow:\s*hidden/s);
        expect(css).toMatch(/\.workspace-wallet-pagination\s*\{[^}]*margin-top:\s*auto/s);
    });
});
