/**
 * Mock data tài chính NCC — dùng tạm cho đến khi backend bổ sung API.
 * Schema tham chiếu comment trong suppilerService.js (getFinanceOverview / getFinanceList).
 */

const MOCK_SUPPLIERS = [
    {
        id: 1,
        company_name: "Công ty Nông sản Xanh Việt",
        tax_code: "0312456789",
        phone: "0901234567",
        address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
        verification_status: "approved",
        total_revenue: 2850000000,
        cash_in: 2420000000,
        cash_out: 680000000,
        commission_rate: 5.5,
        commission_amount: 156750000,
        net_revenue: 2693250000,
        order_count: 128,
        cash_flow: [
            { month: "2026-01", in: 380000000, out: 95000000 },
            { month: "2026-02", in: 420000000, out: 110000000 },
            { month: "2026-03", in: 510000000, out: 125000000 },
        ],
        updated_at: "2026-07-01T08:00:00Z",
    },
    {
        id: 2,
        company_name: "HTX Rau Sạch Đà Lạt",
        tax_code: "5800123456",
        phone: "02633881234",
        address: "Khu công nghiệp Lộc Phát, Đà Lạt, Lâm Đồng",
        verification_status: "approved",
        total_revenue: 1920000000,
        cash_in: 1650000000,
        cash_out: 420000000,
        commission_rate: 4.8,
        commission_amount: 92160000,
        net_revenue: 1827840000,
        order_count: 96,
        cash_flow: [
            { month: "2026-01", in: 280000000, out: 72000000 },
            { month: "2026-02", in: 310000000, out: 80000000 },
            { month: "2026-03", in: 350000000, out: 88000000 },
        ],
        updated_at: "2026-07-01T09:15:00Z",
    },
    {
        id: 3,
        company_name: "Nông trại Hữu Cơ Mekong",
        tax_code: "1400987654",
        phone: "02923778899",
        address: "Ấp Tân Hòa, Cần Thơ",
        verification_status: "approved",
        total_revenue: 1560000000,
        cash_in: 1380000000,
        cash_out: 310000000,
        commission_rate: 6,
        commission_amount: 93600000,
        net_revenue: 1466400000,
        order_count: 74,
        cash_flow: [
            { month: "2026-01", in: 220000000, out: 50000000 },
            { month: "2026-02", in: 240000000, out: 55000000 },
            { month: "2026-03", in: 260000000, out: 60000000 },
        ],
        updated_at: "2026-06-28T14:30:00Z",
    },
    {
        id: 4,
        company_name: "Công ty CP Thực phẩm An Nhiên",
        tax_code: "0108765432",
        phone: "02435678901",
        address: "KCN Sài Đồng, Long Biên, Hà Nội",
        verification_status: "pending",
        total_revenue: 420000000,
        cash_in: 350000000,
        cash_out: 120000000,
        commission_rate: 5,
        commission_amount: 21000000,
        net_revenue: 399000000,
        order_count: 18,
        cash_flow: [
            { month: "2026-01", in: 80000000, out: 30000000 },
            { month: "2026-02", in: 95000000, out: 35000000 },
        ],
        updated_at: "2026-06-25T10:00:00Z",
    },
    {
        id: 5,
        company_name: "Trang trại Trái cây Miền Tây",
        tax_code: "1200345678",
        phone: "0919876543",
        address: "Huyện Chợ Mới, An Giang",
        verification_status: "approved",
        total_revenue: 980000000,
        cash_in: 860000000,
        cash_out: 195000000,
        commission_rate: 4.5,
        commission_amount: 44100000,
        net_revenue: 935900000,
        order_count: 52,
        cash_flow: [
            { month: "2026-01", in: 150000000, out: 35000000 },
            { month: "2026-02", in: 170000000, out: 40000000 },
            { month: "2026-03", in: 180000000, out: 42000000 },
        ],
        updated_at: "2026-06-30T16:45:00Z",
    },
    {
        id: 6,
        company_name: "Công ty TNHH Nông nghiệp Bình Minh",
        tax_code: "0315678901",
        phone: "0938123456",
        address: "KCN Hiệp Phước, Nhà Bè, TP.HCM",
        verification_status: "rejected",
        total_revenue: 85000000,
        cash_in: 60000000,
        cash_out: 45000000,
        commission_rate: 7,
        commission_amount: 5950000,
        net_revenue: 79050000,
        order_count: 6,
        cash_flow: [{ month: "2026-03", in: 60000000, out: 45000000 }],
        updated_at: "2026-05-20T11:20:00Z",
    },
    {
        id: 7,
        company_name: "HTX Rau củ Quả Bắc Giang",
        tax_code: "2400112233",
        phone: "02043876543",
        address: "Huyện Yên Dũng, Bắc Giang",
        verification_status: "approved",
        total_revenue: 720000000,
        cash_in: 640000000,
        cash_out: 145000000,
        commission_rate: 5.2,
        commission_amount: 37440000,
        net_revenue: 682560000,
        order_count: 41,
        cash_flow: [
            { month: "2026-01", in: 110000000, out: 25000000 },
            { month: "2026-02", in: 120000000, out: 28000000 },
            { month: "2026-03", in: 130000000, out: 30000000 },
        ],
        updated_at: "2026-07-02T08:30:00Z",
    },
    {
        id: 8,
        company_name: "Công ty Thực phẩm Sạch Sài Gòn",
        tax_code: "0319988776",
        phone: "02838234567",
        address: "Quận 12, TP.HCM",
        verification_status: "pending",
        total_revenue: 310000000,
        cash_in: 260000000,
        cash_out: 88000000,
        commission_rate: 5.8,
        commission_amount: 17980000,
        net_revenue: 292020000,
        order_count: 22,
        cash_flow: [
            { month: "2026-02", in: 90000000, out: 30000000 },
            { month: "2026-03", in: 100000000, out: 35000000 },
        ],
        updated_at: "2026-06-29T13:00:00Z",
    },
    {
        id: 9,
        company_name: "Nông sản Củ Chi Organic",
        tax_code: "0312233445",
        phone: "0908765432",
        address: "Huyện Củ Chi, TP.HCM",
        verification_status: "approved",
        total_revenue: 1340000000,
        cash_in: 1180000000,
        cash_out: 265000000,
        commission_rate: 4.2,
        commission_amount: 56280000,
        net_revenue: 1283720000,
        order_count: 67,
        cash_flow: [
            { month: "2026-01", in: 190000000, out: 42000000 },
            { month: "2026-02", in: 210000000, out: 48000000 },
            { month: "2026-03", in: 230000000, out: 52000000 },
        ],
        updated_at: "2026-07-03T07:45:00Z",
    },
    {
        id: 10,
        company_name: "Công ty CP Nông nghiệp Phương Nam",
        tax_code: "0305566778",
        phone: "0912345678",
        address: "KCN Tân Bình, TP.HCM",
        verification_status: "approved",
        total_revenue: 2100000000,
        cash_in: 1850000000,
        cash_out: 490000000,
        commission_rate: 5,
        commission_amount: 105000000,
        net_revenue: 1995000000,
        order_count: 103,
        cash_flow: [
            { month: "2026-01", in: 320000000, out: 85000000 },
            { month: "2026-02", in: 340000000, out: 90000000 },
            { month: "2026-03", in: 360000000, out: 95000000 },
        ],
        updated_at: "2026-07-04T09:00:00Z",
    },
    {
        id: 11,
        company_name: "Trang trại Gà & Trứng Đồng Nai",
        tax_code: "3600445566",
        phone: "02513889900",
        address: "Huyện Long Thành, Đồng Nai",
        verification_status: "rejected",
        total_revenue: 120000000,
        cash_in: 95000000,
        cash_out: 62000000,
        commission_rate: 6.5,
        commission_amount: 7800000,
        net_revenue: 112200000,
        order_count: 9,
        cash_flow: [{ month: "2026-02", in: 95000000, out: 62000000 }],
        updated_at: "2026-05-15T15:30:00Z",
    },
    {
        id: 12,
        company_name: "Công ty Thủy sản Sạch Cà Mau",
        tax_code: "2000778899",
        phone: "02903887766",
        address: "TP. Cà Mau",
        verification_status: "approved",
        total_revenue: 890000000,
        cash_in: 780000000,
        cash_out: 175000000,
        commission_rate: 4.9,
        commission_amount: 43610000,
        net_revenue: 846390000,
        order_count: 48,
        cash_flow: [
            { month: "2026-01", in: 140000000, out: 32000000 },
            { month: "2026-02", in: 155000000, out: 35000000 },
            { month: "2026-03", in: 160000000, out: 38000000 },
        ],
        updated_at: "2026-07-02T11:15:00Z",
    },
];

function filterSuppliers({ search, verification_status } = {}) {
    const normalizedSearch = String(search ?? "").trim().toLowerCase();

    return MOCK_SUPPLIERS.filter((item) => {
        const matchStatus =
            !verification_status ||
            item.verification_status === verification_status;

        const matchSearch =
            !normalizedSearch ||
            item.company_name.toLowerCase().includes(normalizedSearch) ||
            item.tax_code.toLowerCase().includes(normalizedSearch);

        return matchStatus && matchSearch;
    });
}

function buildOverviewFromList(list) {
    const totals = list.reduce(
        (acc, item) => {
            acc.totalRevenue += item.total_revenue;
            acc.cashIn += item.cash_in;
            acc.cashOut += item.cash_out;
            acc.commissionTotal += item.commission_amount;
            acc.commissionRateSum += item.commission_rate;
            return acc;
        },
        {
            totalRevenue: 0,
            cashIn: 0,
            cashOut: 0,
            commissionTotal: 0,
            commissionRateSum: 0,
        },
    );

    return {
        total_system_revenue: totals.totalRevenue,
        total_cash_in: totals.cashIn,
        total_cash_out: totals.cashOut,
        total_commission: totals.commissionTotal,
        average_commission_rate:
            list.length > 0
                ? Math.round((totals.commissionRateSum / list.length) * 100) / 100
                : 0,
        supplier_count: list.length,
    };
}

const mockDelay = (ms = 280) =>
    new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });

export async function getMockFinanceOverview(params = {}) {
    await mockDelay();
    const filtered = filterSuppliers(params);
    return buildOverviewFromList(filtered);
}

export async function getMockFinanceList(params = {}) {
    await mockDelay();

    const pageSize = Number(params.page_size) || 5;
    const page = Math.max(1, Number(params.page) || 1);
    const filtered = filterSuppliers(params);
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);

    return {
        count: filtered.length,
        next: start + pageSize < filtered.length ? page + 1 : null,
        previous: page > 1 ? page - 1 : null,
        results,
    };
}

export { MOCK_SUPPLIERS };
