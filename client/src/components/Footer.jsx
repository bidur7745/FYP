import React from "react";
import { assets } from "../assets/images/assets";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const { content } = useLanguage();
  const footer = content.footer || {};
  const quickLinks = footer.quickLinks || [];
  const services = footer.services || [];

  const isRouteLink = (href = "") => href.startsWith("/");

  const socialLinks = [
    { name: "Facebook", icon: assets.facebookIcon, href: "#" },
    { name: "Instagram", icon: assets.instagramIcon, href: "#" },
    { name: "Twitter", icon: assets.twitterIcon, href: "#" },
    { name: "YouTube", icon: assets.youtubeIcon, href: "#" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo + Subheading */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src={assets.logo}
                alt="logo"
                className="h-16 w-16 rounded-full bg-white backdrop-blur-sm p-2 shadow-lg border border-emerald-500/20"
              />
              <h3 className="text-2xl font-bold text-slate-100">KrishiMitra</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              {footer.subheading}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-slate-100 border-b border-emerald-500/30 pb-2">
              {footer.quickLinksTitle}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {isRouteLink(item.href) ? (
                    <Link 
                      to={item.href} 
                      className="text-slate-300 hover:text-emerald-300 transition-colors text-sm inline-block"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a 
                      href={item.href} 
                      className="text-slate-300 hover:text-emerald-300 transition-colors text-sm inline-block"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Site Navigation */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-slate-100 border-b border-emerald-500/30 pb-2">
              {footer.servicesTitle}
            </h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.label}>
                  {isRouteLink(item.href) ? (
                    <Link 
                      to={item.href} 
                      className="text-slate-300 hover:text-emerald-300 transition-colors text-sm inline-block"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a 
                      href={item.href} 
                      className="text-slate-300 hover:text-emerald-300 transition-colors text-sm inline-block"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-slate-100 border-b border-emerald-500/30 pb-2">
              {footer.followUs}
            </h4>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="group relative w-12 h-12 rounded-xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300"
                  aria-label={social.name}
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50 pt-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-sm text-slate-400">
            {/* Policy */}
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

            {/* Copyright */}
            <p className="text-slate-400">
              © {new Date().getFullYear()} KrishiMitra.{" "}
              <span className="text-slate-500">{footer.copyright}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
