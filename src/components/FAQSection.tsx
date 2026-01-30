"use client";

import { motion } from "framer-motion";
import { IoChevronDown } from "react-icons/io5";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    question: "Is it only for bedrock or will it be for java edition?",
    answer: "It's both for Java & Bedrock.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept payments via PayPal, Bitcoin, Litecoin, Ethereum, Solana, Credit/Debit Card and more via Stripe.",
  },
  {
    question: "What do I do if my PayPal order hasn't processed/cancelled?",
    answer: (
      <div>
        <p className="mb-3">
          If your PayPal order hasn&apos;t been processed or was cancelled,
          please reach out to us:
        </p>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start">
            <span className="text-[var(--primary-dark)] mr-2">•</span>
            <span>
              Email us at{" "}
              <a
                href="mailto:mccapesbusiness@gmail.com"
                className="text-[var(--primary-dark)] hover:underline font-medium"
              >
                mccapesbusiness@gmail.com
              </a>
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-[var(--primary-dark)] mr-2">•</span>
            <span>
              Join our{" "}
              <a
                href="https://discord.mccapes.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary-dark)] hover:underline font-medium"
              >
                Discord
              </a>{" "}
              and open a ticket in{" "}
              <span className="font-medium">#customer-support</span>
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: "How do I Redeem the cape?",
    answer: (
      <ol className="space-y-3 mt-2">
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            1.
          </span>
          <span>
            Go to{" "}
            <a
              href="https://www.minecraft.net/en-us/redeem"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary-dark)] hover:underline font-medium"
            >
              https://www.minecraft.net/en-us/redeem
            </a>
          </span>
        </li>
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            2.
          </span>
          <span>Redeem the cape under your profile after logging in.</span>
        </li>
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            3.
          </span>
          <span>Open Bedrock Edition and equip the cape.</span>
        </li>
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            4.
          </span>
          <span>Log out of minecraft.net and log back in.</span>
        </li>
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            5.
          </span>
          <span>Go to your profile&apos;s skin settings.</span>
        </li>
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            6.
          </span>
          <span>Equip the cape.</span>
        </li>
        <li className="flex items-start">
          <span className="font-semibold text-[var(--primary-dark)] mr-2">
            7.
          </span>
          <span>
            Log off any server, then log back on. The cape will appear
            afterward.
          </span>
        </li>
      </ol>
    ),
  },
];

const FAQAccordionItem = ({
  item,
  index,
}: {
  item: FAQItem;
  index: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-effect rounded-xl overflow-hidden mb-4 hover:shadow-lg transition-shadow"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-[var(--foreground)] pr-4">
          {item.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <IoChevronDown className="w-5 h-5 text-[var(--primary-dark)]" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5 text-gray-700 leading-relaxed">
          {typeof item.answer === "string" ? <p>{item.answer}</p> : item.answer}
        </div>
      </motion.div>
    </motion.div>
  );
};

interface FAQSectionProps {
  showTitle?: boolean;
  showContactButtons?: boolean;
}

const FAQSection = ({
  showTitle = false,
  showContactButtons = false,
}: FAQSectionProps) => {
  return (
    <div>
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Frequently Asked Questions</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Find answers to common questions about our Minecraft capes
          </p>
        </motion.div>
      )}

      {/* FAQ Accordion */}
      <div className="mb-16">
        {faqData.map((item, index) => (
          <FAQAccordionItem key={index} item={item} index={index} />
        ))}
      </div>

      {/* Contact Section */}
      {showContactButtons && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-effect rounded-xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-3 text-[var(--foreground)]">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Feel free to
            reach out to our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:mccapesbusiness@gmail.com"
              className="minecraft-btn inline-block"
            >
              Email Support
            </a>
            <a
              href="https://discord.mccapes.net"
              target="_blank"
              rel="noopener noreferrer"
              className="minecraft-btn inline-block"
            >
              Join Discord
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FAQSection;
