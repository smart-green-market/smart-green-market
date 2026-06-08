import React, { useState } from "react";
import LeftPanel from "../../components/Supplier/Register/LeftPanel";
import StepBar from "../../components/Supplier/Register/StepBar";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import StepDone from "./StepDone";

export default function RegisterPage() {
  const [step, setStep] = useState(0);

  return (
    <div className="flex min-h-screen w-full">
      {/* Left decorative panel */}
      <LeftPanel />

      {/* Right form panel */}
      <div className="flex-1 bg-gray-50 p-12 flex items-start justify-center overflow-y-auto min-h-screen">
        <div className="w-full max-w-[440px] pt-6">
          {/* Step indicator — hidden on success screen */}
          {step < 3 && <StepBar current={step} />}

          {step === 0 && <Step1 onNext={() => setStep(1)} />}
          {step === 1 && <Step2 onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <Step3 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepDone />}
        </div>
      </div>
    </div>
  );
}
