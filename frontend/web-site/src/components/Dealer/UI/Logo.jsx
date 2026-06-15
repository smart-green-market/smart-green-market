import { Leaf } from "lucide-react";

export default function Logo() {
    return (
        <div className="w-56 flex items-center px-2 gap-2">
            {/* Small leaf icon to signify fresh organic food */}
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Leaf className="w-4.5 h-4.5 text-emerald-700" />
            </div>
            <span className="text-emerald-950 text-lg font-extrabold font-['Noto_Serif',serif] leading-7 tracking-tight">
                GreenMarket 
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider ml-1 border border-emerald-200/50">
                    Dealer
                </span>
            </span>
        </div>
    );
}