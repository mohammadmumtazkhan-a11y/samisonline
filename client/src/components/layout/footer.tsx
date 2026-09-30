import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#49256b] text-white">
      <div className="w-full px-5 py-10">
        {/* Links Grid — 5 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-sm mb-3">Contact Info</h4>
            <div className="space-y-2 text-xs text-white/70 leading-relaxed">
              <p>Samisonline is the UK's one-stop Afro-Caribbean Online Store. We specialise in groceries and original products of African and Caribbean heritage.</p>
              <p>B & T Enterprise Ltd, 82-83 Card Street E116 3RJ, Birmingham, United Kingdom</p>
              <p>orders@samisonline.com</p>
              <p>07944 591421</p>
            </div>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="font-bold text-sm mb-3">Help & Support</h4>
            <ul className="space-y-1.5">
              {["FAQ", "Delivery & Returns", "About Us", "Contact us"].map((item) => (
                <li key={item}>
                  <button className="text-xs text-white/70 hover:text-accent transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Business */}
          <div>
            <h4 className="font-bold text-sm mb-3">Business</h4>
            <ul className="space-y-1.5">
              {["About Us", "Careers", "Blog", "Become a Trader"].map((item) => (
                <li key={item}>
                  <button className="text-xs text-white/70 hover:text-accent transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm mb-3">Legal</h4>
            <ul className="space-y-1.5">
              {["Privacy Policy", "Shopping Policy", "Terms & Conditions", "Refund Policy"].map((item) => (
                <li key={item}>
                  <button className="text-xs text-white/70 hover:text-accent transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Investor Badge */}
          <div>
            <h4 className="font-bold text-sm mb-3">Investor Badge</h4>
            <img
              src="/assets/investor_badge.svg"
              alt="Investor Badge"
              className="w-32 h-auto"
              loading="lazy"
            />
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3 mb-6">
          {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
            <button
              key={i}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-accent hover:text-black transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Payment Options:</span>
            <div className="flex gap-1.5">
              <div className="bg-white rounded px-2 py-0.5 text-[10px] font-bold text-blue-700">
                VISA
              </div>
              <div className="bg-white rounded px-2 py-0.5 text-[10px] font-bold text-orange-600">
                MC
              </div>
            </div>
          </div>
          <p className="text-[11px] text-white/50 text-center">
            Copyright &copy; {new Date().getFullYear()}{" "}
            <span className="text-accent">Samisonline</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
