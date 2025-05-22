"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function FeatureSections({ sections }) {
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    // Store the clicked item data in localStorage for the detail page
    localStorage.setItem("selectedItem", JSON.stringify(item));
    navigate(
      `/detail/${encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, "-"))}`,
    );
  };

  return (
    <div className="space-y-16 mt-5">
      {sections.map((section, index) => (
        <div key={index} className="feature-section">
          {section.isLargeCard ? (
            <LargeCardSection
              title={section.section}
              subtitle={section.subtitle}
              items={section.items}
              sectionIndex={index}
              onCardClick={handleCardClick}
            />
          ) : (
            <SmallCardSection
              title={section.section}
              subtitle={section.subtitle}
              items={section.items}
              sectionIndex={index}
              onCardClick={handleCardClick}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function LargeCardSection({
  title,
  subtitle,
  items,
  sectionIndex,
  onCardClick,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay visibility to trigger animations
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-gray-400">{subtitle}</p>}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col"
            variants={itemVariants}
          >
            <div
              className="block h-full cursor-pointer"
              onClick={() => onCardClick(item)}
            >
              <motion.div
                className={`relative overflow-hidden rounded-xl aspect-[16/9] bg-gradient-to-br ${item.gradient} p-6 flex items-center justify-center cursor-pointer mb-2`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => setHoveredId(index)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-80" />
                <div className="relative z-10 text-center">
                  <h3 className="text-3xl font-bold">{item.name}</h3>
                </div>
              </motion.div>
              <div className="p-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function SmallCardSection({
  title,
  subtitle,
  items,
  sectionIndex,
  onCardClick,
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay visibility to trigger animations
    const timer = setTimeout(
      () => {
        setIsVisible(true);
      },
      100 + sectionIndex * 100,
    );

    return () => clearTimeout(timer);
  }, [sectionIndex]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-gray-400">{subtitle}</p>}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {items.map((item, index) => (
          <motion.div key={index} variants={itemVariants}>
            <div
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => onCardClick(item)}
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
              >
                <span className="text-sm font-medium">
                  {item.name.length > 13
                    ? item.name.slice(0, 13) + "..."
                    : item.name}
                </span>
              </div>
              <div>
                <h3 className="font-bold group-hover:translate-x-1 transition-transform duration-300">
                  {item.name}
                </h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
