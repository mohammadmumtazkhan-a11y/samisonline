import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function AuthLayout({ children, heading, subtitle, onBack }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/5 via-white to-white flex flex-col items-center justify-start sm:justify-center px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-8">
      {/* Logo */}
      <div className="mb-8 sm:mb-6">
        <img
          src="/assets/logo.svg"
          alt="Samis Online"
          className="h-14 sm:h-16 w-auto"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "/assets/Low-quality_logo.png";
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 -ml-2 px-2 py-2 sm:ml-0 sm:px-0 sm:py-0 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Heading */}
        <h1 className="text-[26px] max-sm:leading-tight sm:text-2xl font-bold text-black mb-1.5 sm:mb-1">{heading}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        )}
        {!subtitle && <div className="mb-6" />}

        {/* Content */}
        {children}
      </div>

      {/* Footer */}
      <p className="mt-auto sm:mt-8 pt-10 sm:pt-0 text-[11px] text-gray-400 text-center">
        Powered by <span className="text-primary font-medium">Mito.Money</span>
      </p>
    </div>
  );
}
