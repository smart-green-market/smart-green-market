import { Link } from "react-router-dom";
import { useScrollToHash } from "../../../hooks/useScrollToHash";

export default function StaticDocPage({
    title,
    description,
    sections = [],
    basePath = "",
    relatedLink = null,
}) {
    useScrollToHash();

    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-10 sm:py-14">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-emerald-950 sm:text-4xl">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-3 max-w-3xl text-base leading-relaxed text-neutral-600">
                        {description}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
                <aside className="lg:sticky lg:top-28 lg:self-start">
                    <nav className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-800">
                            Mục lục
                        </p>
                        <ul className="space-y-1">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <Link
                                        to={{ pathname: basePath, hash: `#${section.id}` }}
                                        className="block rounded-lg px-3 py-2 text-sm text-neutral-700 no-underline transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                                    >
                                        {section.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                <div className="space-y-8">
                    {sections.map((section) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-28 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
                        >
                            <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                                {section.title}
                            </h2>
                            <div className="mt-4 space-y-4 text-sm leading-7 text-neutral-700 sm:text-base">
                                {section.content}
                            </div>
                        </section>
                    ))}

                    {relatedLink ? (
                        <p className="text-sm text-neutral-500">
                            Cần thêm thông tin? Xem trang{" "}
                            <Link
                                to={relatedLink.to}
                                className="font-medium text-emerald-800 no-underline hover:underline"
                            >
                                {relatedLink.label}
                            </Link>
                            .
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
