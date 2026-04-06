import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function AuthLayout({ children, heading, subtitle, onBack }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-white flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-6">
        <img
          src="/assets/logo.svg"
          alt="Samis Online"
          className="h-16 w-auto"
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
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Heading */}
        <h1 className="text-2xl font-bold text-black mb-1">{heading}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        )}
        {!subtitle && <div className="mb-6" />}

        {/* Content */}
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-[11px] text-gray-400 text-center">
        Powered by <span className="text-primary font-medium">Mito.Money</span>
      </p>
    </div>
  );
}
