import { Button } from "@/components/atoms/Button";
import heroImage from "../assets/hero.jpg";
import Header from "@/components/organisms/Header";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/atoms/Container";
import {
  Camera,
  Sparkles,
  Hammer,
  WandSparkles,
  DollarSign,
  Shield,
  Mic,
} from "lucide-react";
import { Card } from "@/components/molecules/Card";
import Footer from "@/components/organisms/Footer";
import { motion } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      {/* hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Modern kitchen renovation"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-neutral-900/80 via-neutral-900/60 to-neutral-900/30" />
        </div>
        <Container>
          <div className="relative py-24 md:py-42">
            <motion.div
              className="xl:w-1/2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="mb-6 text-card md:text-5xl lg:text-6xl">
                Visualize Your Dream Home Before You Build
              </h1>
              <p className="mb-8 text-lg text-card/80 md:text-xl">
                Upload a photo, get AI-powered design visualizations, instant
                cost estimates, and connect with verified contractors.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/register")}
                  className="gradient-accent shadow-lg hover:opacity-90"
                >
                  Design Your Space Free
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => navigate("/how-it-works")}
                  className="border-card/30 bg-card/10 text-card backdrop-blur hover:bg-card/20"
                >
                  Learn How It Works
                </Button>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>
      {/* stats section */}
      <section className="py-16 bg-white border-b border-b-neutral-200">
        <Container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Staggered fade-in for each stat block, triggered on viewport */}
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <h1 className="text-primary-600">10,000+</h1>
            <p className="text-sm text-neutral-500">Designs Created</p>
          </motion.div>
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <h1 className="text-primary-600">500+</h1>
            <p className="text-sm text-neutral-500">Verified Contractors</p>
          </motion.div>
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <h1 className="text-primary-600">$5M+</h1>
            <p className="text-sm text-neutral-500">Projects Completed</p>
          </motion.div>
        </Container>
      </section>
      {/* how it works section */}
      <section className="py-16 bg-neutral-50">
        <Container>
          <h3 className="capitalize text-center">how it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-12">
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className="bg-linear-to-br from-primary-500 to-primary-900 p-4.5 rounded-2xl mb-4">
                <Camera size={32} className="text-white" />
              </div>
              <div className="bg-primary-100 text-primary-500 text-xs size-6 rounded-full mb-2 flex justify-center items-center">
                1
              </div>
              <div className="text-center flex flex-col items-center">
                <h6 className="text-neutral-800">Upload Your Photo</h6>
                <p className="text-neutral-500 text-sm">
                  Take a photo of your space or upload an existing one
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className="bg-linear-to-br from-primary-500 to-primary-900 p-4.5 rounded-2xl mb-4">
                <Sparkles size={32} className="text-white" />
              </div>
              <div className="bg-primary-100 text-primary-500 text-xs size-6 rounded-full mb-2 flex justify-center items-center">
                2
              </div>
              <div className="text-center flex flex-col items-center">
                <h6 className="text-neutral-800">AI Designs Your Space</h6>
                <p className="text-neutral-500 text-sm">
                  Choose styles and get instant AI-generated visualizations
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className="bg-linear-to-br from-primary-500 to-primary-900 p-4.5 rounded-2xl mb-4">
                <Hammer size={32} className="text-white" />
              </div>
              <div className="bg-primary-100 text-primary-500 text-xs size-6 rounded-full mb-2 flex justify-center items-center">
                3
              </div>
              <div className="text-center flex flex-col items-center">
                <h6 className="text-neutral-800">Hire & Build</h6>
                <p className="text-neutral-500 text-sm">
                  Get estimates, hire contractors, and track progress
                </p>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>
      {/* powerful features section */}
      <section className="py-16 bg-neutral-100">
        <Container>
          <h3 className="capitalize text-center">powerful features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <Card hoverable className="group">
                <div className="w-fit bg-primary-100 transition-all duration-300 ease-in-out group-hover:bg-linear-to-br group-hover:from-primary-500 group-hover:to-primary-900 p-4 rounded-2xl mb-4">
                  <WandSparkles
                    size={26}
                    className="text-primary-600 group-hover:text-white transition-colors duration-300 ease-in-out"
                  />
                </div>
                <h6 className="text-neutral-800 mb-2">AI Design Studio</h6>
                <p className="text-neutral-500 text-sm">
                  Generate unlimited design variations with AI. See your space
                  transformed in seconds.
                </p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <Card hoverable className="group">
                <div className="w-fit bg-primary-100 transition-all duration-300 ease-in-out group-hover:bg-linear-to-br group-hover:from-primary-500 group-hover:to-primary-900 p-4 rounded-2xl mb-4">
                  <DollarSign
                    size={26}
                    className="text-primary-600 group-hover:text-white transition-colors duration-300 ease-in-out"
                  />
                </div>
                <h6 className="text-neutral-800 mb-2">AI Design Studio</h6>
                <p className="text-neutral-500 text-sm">
                  Generate unlimited design variations with AI. See your space
                  transformed in seconds.
                </p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <Card hoverable className="group">
                <div className="w-fit bg-primary-100 transition-all duration-300 ease-in-out group-hover:bg-linear-to-br group-hover:from-primary-500 group-hover:to-primary-900 p-4 rounded-2xl mb-4">
                  <Shield
                    size={26}
                    className="text-primary-600 group-hover:text-white transition-colors duration-300 ease-in-out"
                  />
                </div>
                <h6 className="text-neutral-800 mb-2">AI Design Studio</h6>
                <p className="text-neutral-500 text-sm">
                  Generate unlimited design variations with AI. See your space
                  transformed in seconds.
                </p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <Card hoverable className="group">
                <div className="w-fit bg-primary-100 transition-all duration-300 ease-in-out group-hover:bg-linear-to-br group-hover:from-primary-500 group-hover:to-primary-900 p-4 rounded-2xl mb-4">
                  <Mic
                    size={26}
                    className="text-primary-600 group-hover:text-white transition-colors duration-300 ease-in-out"
                  />
                </div>
                <h6 className="text-neutral-800 mb-2">AI Design Studio</h6>
                <p className="text-neutral-500 text-sm">
                  Generate unlimited design variations with AI. See your space
                  transformed in seconds.
                </p>
              </Card>
            </motion.div>
          </div>
        </Container>
      </section>
      {/* CTA section */}
      <section className="py-16 bg-linear-to-br from-primary-600 via-primary-700 to-primary-800">
        <Container>
          <div className="text-center">
            <h1 className="text-white mb-4 text-4xl md:text-5xl">
              Ready to Transform Your Space?
            </h1>
            <p className="text-white text-sm md:text-base max-w-2xl mx-auto">
              Join thousands of homeowners who've brought their vision to life
            </p>
            <Button variant="secondary" size="md" className="mt-10">
              Get Started
            </Button>
          </div>
        </Container>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage;
