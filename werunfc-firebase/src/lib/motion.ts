export const easeOut: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
export const easeStandard: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: easeOut } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: easeOut } },
};
