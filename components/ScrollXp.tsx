"use client";

import { motion, useScroll } from "framer-motion";

export function ScrollXp() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="scroll-xp" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}
