import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/components/auth/auth-layout";
import EmailStep from "@/components/auth/email-step";
import SignInStep from "@/components/auth/sign-in-step";
import SignUpForm from "@/components/auth/sign-up-form";
import BusinessStep2 from "@/components/auth/business-step2";
import OtpStep from "@/components/auth/otp-step";

type AuthStep = "email" | "signIn" | "signUp" | "businessStep2" | "otp";

const stepConfig: Record<AuthStep, { heading: string; subtitle?: string }> = {
  email: {
    heading: "Welcome",
    subtitle: "Enter your email to sign in or create an account",
  },
  signIn: {
    heading: "Sign In",
    subtitle: "Enter your password to continue",
  },
  signUp: {
    heading: "Create Account",
    subtitle: "Fill in your details to get started",
  },
  businessStep2: {
    heading: "Director Details",
    subtitle: "Complete your business registration",
  },
  otp: {
    heading: "Verify Email",
    subtitle: "Enter the verification code sent to your email",
  },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [businessStep1Data, setBusinessStep1Data] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);

  const goTo = (nextStep: AuthStep, dir: number = 1) => {
    setDirection(dir);
    setStep(nextStep);
  };

  const config = stepConfig[step];
  const showBack = step !== "email";

  const handleBack = () => {
    if (step === "signIn" || step === "signUp") goTo("email", -1);
    else if (step === "businessStep2") goTo("signUp", -1);
    else if (step === "otp") goTo("email", -1);
  };

  return (
    <AuthLayout
      heading={config.heading}
      subtitle={config.subtitle}
      onBack={showBack ? handleBack : undefined}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {step === "email" && (
            <EmailStep
              onRegistered={(e) => {
                setEmail(e);
                goTo("signIn");
              }}
              onNew={(e) => {
                setEmail(e);
                goTo("signUp");
              }}
              onPending={(e, otp) => {
                setEmail(e);
                setDevOtp(otp || "123456");
                goTo("otp");
              }}
            />
          )}

          {step === "signIn" && (
            <SignInStep email={email} onBack={handleBack} />
          )}

          {step === "signUp" && (
            <SignUpForm
              email={email}
              onBack={handleBack}
              onOtp={(otp) => {
                setDevOtp(otp);
                goTo("otp");
              }}
              onBusinessStep2={(data) => {
                setBusinessStep1Data(data);
                goTo("businessStep2");
              }}
            />
          )}

          {step === "businessStep2" && (
            <BusinessStep2
              email={email}
              step1Data={businessStep1Data}
              onBack={handleBack}
              onOtp={(otp) => {
                setDevOtp(otp);
                goTo("otp");
              }}
            />
          )}

          {step === "otp" && (
            <OtpStep email={email} devOtp={devOtp} onBack={handleBack} />
          )}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
