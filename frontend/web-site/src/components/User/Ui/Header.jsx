import { Search, ShoppingCart, Newspaper, User } from "lucide-react";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
            <div className="max-w-[1280px] mx-auto px-10 h-[72px] flex items-center justify-between gap-8">

                {/* Logo + Nav */}
                <div className="flex items-center gap-8 shrink-0">
                    <span className="text-emerald-950 text-2xl font-bold font-serif cursor-pointer select-none">
                        GreenMarket
                    </span>
                    <nav className="flex items-center gap-6">
                        <a href="#" className="text-neutral-600 text-sm font-medium hover:scale-105 hover:text-green-600 transition-colors">
                            Cửa hàng
                        </a>
                        <a href="#" className="text-neutral-600 text-sm font-medium hover:scale-105 hover:text-green-600 transition-colors">
                            Danh mục
                        </a>
                    </nav>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thực phẩm sạch..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Icons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700">
                        <Newspaper className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700">
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-zinc-100 hover:text-green-600 transition-colors text-zinc-700">
                        <User className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </header>
    );
}