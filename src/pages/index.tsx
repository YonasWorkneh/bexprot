import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Wallet,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/PublicNavigation";
import FeaturesSection from "@/components/features/FeaturesSection";
import LogoCarousel from "@/components/LogoCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import LighthouseEffect from "@/components/LighthouseEffect";
import TubesBackground from "@/components/TubesBackground";
import bitcoinPrice from "@/assets/bitcoin-price.png";
import cryptoTable from "@/assets/crypto-table.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <TubesBackground />
      <LighthouseEffect />
      <Navigation />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative container px-4 pt-40 pb-20"
      >
        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block mb-4 px-4 py-1.5 rounded-full glass"
        >
          <span className="text-sm font-medium">
            <img
              src="https://bexprot.com/favicon.png"
              alt="Bexprot"
              className="w-4 h-4 inline-block mr-2"
            />
            Next-gen crypto & stock trading platform
          </span>
        </motion.div>

        <div className="max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-normal mb-4 tracking-tight text-left">
            <span className="text-gray-200">
              <TextGenerateEffect words="Trade with" />
            </span>
            <br />
            <span className="text-white font-medium">
              <TextGenerateEffect words="confidence." />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl text-left"
          >
            Experience seamless cryptocurrency and stock trading with advanced
            features, real-time analytics, and institutional-grade security.{" "}
            <span className="text-white">Start trading in minutes.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 items-start"
          >
            <Button size="lg" className="button-gradient text-white" asChild>
              <Link to="/dashboard">Start Trading Now</Link>
            </Button>
            <Button size="lg" variant="link" className="text-white" asChild>
              <Link to="/markets">View Markets</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative mx-auto max-w-5xl mt-20"
        >
          <div className="glass rounded-xl overflow-hidden">
            <img
              src={cryptoTable}
              alt="Bexprot Trading Dashboard"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Logo Carousel */}
      <LogoCarousel />

      {/* Features Section */}
      <div id="features" className="bg-black">
        <FeaturesSection />
      </div>

      {/* About Us Section */}
      <section id="about" className="container px-4 py-20 bg-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">About Bexprot</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empowering traders worldwide with cutting-edge technology and
            institutional-grade trading tools.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Our Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-8"
          >
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Our Story
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Bexprot was founded with a simple yet powerful vision: to make
              professional-grade trading accessible to everyone. We recognized
              that the financial markets were evolving rapidly, and traders
              needed a platform that could keep pace with innovation while
              maintaining the highest standards of security and reliability.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Today, we serve over 50,000 active traders across the globe,
              processing billions in trading volume while maintaining a 99.9%
              uptime guarantee. Our commitment to excellence has made us a
              trusted partner for both individual traders and institutional
              investors.
            </p>
          </motion.div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8"
            >
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Our Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to advanced trading tools and market
                insights, enabling traders of all levels to make informed
                decisions and achieve their financial goals. We believe that
                everyone deserves access to the same powerful tools used by
                professional traders.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8"
            >
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                Our Vision
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To become the world's most trusted and innovative trading
                platform, setting new standards for security, performance, and
                user experience. We envision a future where trading is seamless,
                secure, and accessible to everyone, regardless of their location
                or experience level.
              </p>
            </motion.div>
          </div>

          {/* Core Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-8"
          >
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Our Core Values
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Security First",
                  description:
                    "We prioritize the safety of your assets and data above all else, implementing bank-grade security measures and regular audits.",
                },
                {
                  title: "Innovation",
                  description:
                    "We continuously evolve our platform with cutting-edge technology to stay ahead of market trends and user needs.",
                },
                {
                  title: "Transparency",
                  description:
                    "We believe in clear communication, honest pricing, and providing full visibility into our operations and fees.",
                },
                {
                  title: "User-Centric",
                  description:
                    "Every feature we build is designed with our users in mind, ensuring an intuitive and powerful trading experience.",
                },
              ].map((value, index) => (
                <div key={value.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-semibold mb-2">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Why Choose Us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-8"
          >
            <h3 className="text-2xl font-semibold mb-6">Why Choose Bexprot?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Shield className="w-8 h-8 text-primary" />,
                  title: "Bank-Grade Security",
                  description:
                    "Your assets are protected with industry-leading security measures and encryption.",
                },
                {
                  icon: <TrendingUp className="w-8 h-8 text-primary" />,
                  title: "Real-Time Trading",
                  description:
                    "Execute trades instantly with our lightning-fast order execution system.",
                },
                {
                  icon: <Wallet className="w-8 h-8 text-primary" />,
                  title: "Multi-Asset Support",
                  description:
                    "Trade cryptocurrencies, stocks, forex, and commodities all in one platform.",
                },
                {
                  icon: <BarChart3 className="w-8 h-8 text-primary" />,
                  title: "Advanced Analytics",
                  description:
                    "Make informed decisions with professional charts and market analysis tools.",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="text-center"
                >
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container px-4 py-20 bg-black">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$2B+", label: "Trading Volume" },
              { value: "150+", label: "Supported Assets" },
              { value: "50K+", label: "Active Traders" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Prices Preview */}
      <section className="container px-4 py-20 bg-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Live Market Prices
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track real-time prices of your favorite assets directly on our
            platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="glass rounded-xl overflow-hidden">
            <img
              src={bitcoinPrice}
              alt="Bitcoin Live Price"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <div id="testimonials" className="bg-black">
        <TestimonialsSection />
      </div>

      {/* CTA Section */}
      <section className="container px-4 py-20 relative bg-black/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0A0A0A]/80 backdrop-blur-lg border border-white/10 rounded-2xl p-8 md:p-12 text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start trading?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have already discovered the power of
            Bexprot.
          </p>
          <Button size="lg" className="button-gradient text-white" asChild>
            <Link to="/auth">Create Account</Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <div className="bg-black">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
