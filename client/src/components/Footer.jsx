import React from "react";
import { assets } from "../assets/images/assets";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Mail } from "lucide-react";

const Footer = () => {
  const { content } = useLanguage();
  const footer = content.footer || {};
  const quickLinks = footer.quickLinks || [];
  const services = footer.services || [];

  const socialLinks = [
    { name: "Facebook", icon: assets.facebookIcon, href: "#" },
    { name: "Instagram", icon: assets.instagramIcon, href: "#" },
    { name: "Twitter", icon: assets.twitterIcon, href: "#" },
    { name: "YouTube", icon: assets.youtubeIcon, href: "#" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Logo + Subheading */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src={assets.logo}
                alt="logo"
                className="h-16 w-16 rounded-full bg-white backdrop-blur-sm p-2 shadow-lg border border-emerald-500/20"
              />
              <h3 className="text-2xl font-bold text-slate-100">KrishiMitra</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm max-w-sm">
              {footer.subheading}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="group w-10 h-10 rounded-xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300"
                  aria-label={social.name}
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-slate-100 uppercase tracking-wider">
              {footer.quickLinksTitle}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-slate-400 hover:text-emerald-300 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-slate-100 uppercase tracking-wider">
              {footer.servicesTitle}
            </h4>
            <ul className="space-y-2.5">
              {services.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-slate-400 hover:text-emerald-300 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-slate-100 uppercase tracking-wider">
              {footer.contactTitle || "Contact Us"}
            </h4>
            <a
              href={`mailto:${footer.contactEmail || "krishimitra2082@gmail.com"}`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-300 transition-colors break-all"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {footer.contactEmail || "krishimitra2082@gmail.com"}
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50 pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm text-slate-500">
            <div className="flex flex-wrap gap-6">
              <Link
                to="/privacy-policy"
                className="hover:text-emerald-300 transition-colors"
              >
                {footer.privacyPolicy}
              </Link>
              <Link
                to="/terms-conditions"
                className="hover:text-emerald-300 transition-colors"
              >
                {footer.terms}
              </Link>
            </div>
            <p>
              © {new Date().getFullYear()} KrishiMitra. {footer.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
