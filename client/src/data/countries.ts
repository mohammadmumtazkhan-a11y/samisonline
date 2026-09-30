export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countries: Country[] = [
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "https://flagcdn.com/w40/gb.png" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "https://flagcdn.com/w40/ng.png" },
  { name: "United States", code: "US", dialCode: "+1", flag: "https://flagcdn.com/w40/us.png" },
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "https://flagcdn.com/w40/gh.png" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "https://flagcdn.com/w40/ke.png" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "https://flagcdn.com/w40/za.png" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "https://flagcdn.com/w40/ca.png" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "https://flagcdn.com/w40/de.png" },
  { name: "France", code: "FR", dialCode: "+33", flag: "https://flagcdn.com/w40/fr.png" },
  { name: "India", code: "IN", dialCode: "+91", flag: "https://flagcdn.com/w40/in.png" },
  { name: "China", code: "CN", dialCode: "+86", flag: "https://flagcdn.com/w40/cn.png" },
  { name: "UAE", code: "AE", dialCode: "+971", flag: "https://flagcdn.com/w40/ae.png" },
];

export const genders = ["Male", "Female", "Other", "Prefer not to say"];
