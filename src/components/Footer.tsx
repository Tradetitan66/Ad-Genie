import { Heart, Mail, Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Ad-Genie</h3>
            <p className="text-sm leading-relaxed">
              AI-powered ad creation for everyone. Making marketing magic accessible to Indian businesses.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Templates</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm flex items-center gap-2">
            Made with <Heart className="text-red-500 fill-red-500" size={16} /> for Indian businesses
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Mail size={20} />
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Instagram size={20} />
            </a>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-slate-500">
          © 2024 Ad-Genie. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
