import { useMemo } from "react";
import StaticDocPage from "../../components/User/Static/StaticDocPage";
import { getSupportSections } from "../../components/User/Static/supportContent";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";

export default function SupportPage() {
    const paths = useStorefrontPaths();
    const sections = useMemo(
        () => getSupportSections(paths.policies),
        [paths.policies],
    );

    return (
        <StaticDocPage
            title="Hỗ trợ khách hàng"
            description="Thông tin liên hệ, hướng dẫn mua hàng và các câu hỏi thường gặp dành cho người mua trên Smart Green Market."
            sections={sections}
            basePath={paths.support}
            relatedLink={{ label: "Chính sách", to: paths.policies }}
        />
    );
}
