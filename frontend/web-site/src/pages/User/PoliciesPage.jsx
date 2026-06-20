import StaticDocPage from "../../components/User/Static/StaticDocPage";
import { POLICY_SECTIONS } from "../../components/User/Static/policiesContent";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";

export default function PoliciesPage() {
    const paths = useStorefrontPaths();

    return (
        <StaticDocPage
            title="Chính sách"
            description="Các quy định về đổi trả, bảo mật thông tin và điều khoản sử dụng khi mua sắm trên Smart Green Market."
            sections={POLICY_SECTIONS}
            basePath={paths.policies}
            relatedLink={{ label: "Hỗ trợ khách hàng", to: paths.support }}
        />
    );
}
