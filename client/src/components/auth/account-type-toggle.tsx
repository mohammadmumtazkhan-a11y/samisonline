import { motion } from "framer-motion";

interface AccountTypeToggleProps {
  value: "individual" | "business";
  onChange: (type: "individual" | "business") => void;
}

export default function AccountTypeToggle({ value, onChange }: AccountTypeToggleProps) {
  return (
    <div className="relative flex bg-gray-100 rounded-full p-1 mb-6">
      {/* Animated background pill */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-full bg-primary"
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: "calc(50% - 4px)",
          left: value === "individual" ? "4px" : "calc(50% + 0px)",
        }}
      />

      {(["individual", "business"] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
            value === type ? "text-white" : "text-gray-600"
          }`}
        >
          {type === "individual" ? "Individual" : "Business"}
        </button>
      ))}
    </div>
  );
}
