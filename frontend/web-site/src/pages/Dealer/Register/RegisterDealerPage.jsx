import { useState } from "react";
import LeftPanel from "../../../components/Dealer/Register/LeftPanel";
import StepBar from "../../../components/Dealer/Register/StepBar";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import StepDone from "./StepDone";

const EMPTY_PROFILE = {
    store_name: "",
    store_address: "",
    description: "",
};

export default function RegisterDealerPage() {
    const [step, setStep] = useState(0);
    const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE);
    const [resumeMessage, setResumeMessage] = useState("");

    const handleStep1Next = (payload) => {
        if (payload?.profileDraft) {
            setProfileDraft(payload.profileDraft);
        }

        if (payload?.resumeMessage) {
            setResumeMessage(payload.resumeMessage);
        } else {
            setResumeMessage("");
        }

        setStep(payload?.initialStep ?? 1);
    };

    return (
        <div className="flex min-h-screen w-full">
            <LeftPanel />

            <div className="flex min-h-screen flex-1 items-start justify-center overflow-y-auto bg-gray-50 p-12">
                <div className="w-full max-w-[440px] pt-6">
                    {step < 3 && <StepBar current={step} />}

                    {step === 0 && <Step1 onNext={handleStep1Next} />}

                    {step === 1 && (
                        <Step2
                            initialValues={profileDraft}
                            resumeMessage={resumeMessage}
                            onNext={(profile) => {
                                setProfileDraft(profile);
                                setResumeMessage("");
                                setStep(2);
                            }}
                            onBack={() => {
                                setResumeMessage("");
                                setStep(0);
                            }}
                        />
                    )}

                    {step === 2 && (
                        <Step3
                            profile={profileDraft}
                            resumeMessage={resumeMessage}
                            onNext={() => {
                                setResumeMessage("");
                                setStep(3);
                            }}
                            onBack={() => {
                                setResumeMessage("");
                                setStep(1);
                            }}
                        />
                    )}

                    {step === 3 && <StepDone />}
                </div>
            </div>
        </div>
    );
}
