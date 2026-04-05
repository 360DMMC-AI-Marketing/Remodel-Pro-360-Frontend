import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { Container } from "@/components/atoms/Container";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Card } from "@/components/molecules/Card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/api/interceptor";
import { motion } from "framer-motion";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/contact", formData);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || "Failed to send message. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email",
      value: "support@rp360.com",
      href: "mailto:support@rp360.com",
    },
    {
      icon: Phone,
      title: "Phone",
      description: "Call us during business hours",
      value: "+1 (555) 123-4567",
      href: "tel:+15551234567",
    },
    {
      icon: MapPin,
      title: "Office",
      description: "Visit us in person",
      value: "Chicago, Illinois",
      href: "#",
    },
  ];

  return (
    <>
      <Header />
      <div className="bg-neutral-50">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <Container>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-neutral-900 mb-4">Get In Touch</h1>
                <p className="text-lg text-neutral-600">
                  Have questions about RP360? We'd love to hear from you. Send us
                  a message and we'll get back to you as soon as possible.
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="text-center h-full flex flex-col items-center justify-center p-8">
                    <div className="bg-primary-100 p-4 rounded-full mb-4">
                      <method.icon size={32} className="text-primary-600" />
                    </div>
                    <h3 className="text-neutral-900 mb-2">{method.title}</h3>
                    <p className="text-sm text-neutral-500 mb-3">
                      {method.description}
                    </p>
                    <a
                      href={method.href}
                      className="text-primary-600 font-medium hover:text-primary-700 text-sm"
                    >
                      {method.value}
                    </a>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-8 md:p-12">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-8">
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="md"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </Container>
        </section>

        {/* FAQ Section */}
        <section className="py-20 border-t border-neutral-200">
          <Container>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-neutral-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-neutral-600">
                Find answers to common questions about RP360
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {[
                {
                  q: "What is RP360?",
                  a: "RP360 is an AI-powered home renovation marketplace that helps homeowners visualize designs, get instant estimates, and connect with verified contractors.",
                },
                {
                  q: "How much does it cost?",
                  a: "RP360 is free for homeowners. We take a small platform fee when contractors accept projects. No hidden fees.",
                },
                {
                  q: "How long does the renovation process take?",
                  a: "Timeline depends on your project scope. Most projects are completed within 2-12 weeks, with milestone-based payments.",
                },
                {
                  q: "Are contractors verified?",
                  a: "Yes, all contractors go through our vetting process including background checks, license verification, and customer reviews.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {item.q}
                    </h3>
                    <p className="text-neutral-600">{item.a}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
