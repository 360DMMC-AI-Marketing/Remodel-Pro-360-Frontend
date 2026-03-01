import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { Container } from "@/components/atoms/Container";
import { Camera, Sparkles, Hammer, CreditCard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/atoms/Button";
import { NavLink } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      icon: Camera,
      title: "Upload Your Space",
      desc: "Take a photo of any room you want to renovate, or upload an existing image. Our system works with kitchens, bathrooms, living rooms, bedrooms, and exteriors.",
    },
    {
      icon: Sparkles,
      title: "AI Generates Designs",
      desc: "Choose from 6 design styles and let our AI transform your space instantly. Get multiple variations, swap materials, and see real-time cost estimates.",
    },
    {
      icon: Hammer,
      title: "Connect With Contractors",
      desc: "Browse verified contractors, compare bids, and read reviews. Find the perfect match for your project and budget.",
    },
    {
      icon: CreditCard,
      title: "Build With Confidence",
      desc: "Milestone-based payments with AI-verified completion. You only pay when work is done right, with funds held securely in escrow.",
    },
  ];
  return (
    <>
      <Header />
      <div className="bg-neutral-50 py-16">
        <Container>
          <div className="w-fit mx-auto text-center">
            <h2 className="text-neutral-800 mb-2">How RP360 Works</h2>
            <p className="text-lg text-neutral-500">
              From vision to reality in four simple steps
            </p>
          </div>
          <div className="max-w-2xl mx-auto mt-16 space-y-20">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                className="flex items-start space-x-6"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="bg-linear-to-br from-primary-400 to-primary-700 p-4.5 rounded-2xl mb-4">
                  <s.icon size={30} className="text-white" />
                </div>
                <div className="">
                  <span className="text-primary-500 text-xs font-bold">
                    STEP {i + 1}
                  </span>
                  <h6 className="text-neutral-800 text-xl font-semibold">
                    {s.title}
                  </h6>
                  <p className="text-neutral-500">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <NavLink to="/login">
            <Button className="mt-20 flex gap-3 mx-auto">
              Get Started <ArrowRight />
            </Button>
          </NavLink>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default HowItWorks;
