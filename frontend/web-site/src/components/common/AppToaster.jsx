import { Toaster } from "sonner";
import { getToastClassNames } from "./feedbackVariants";

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            closeButton
            richColors={false}
            toastOptions={{
                classNames: getToastClassNames(),
            }}
        />
    );
}
