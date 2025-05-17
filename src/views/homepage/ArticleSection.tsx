import { motion } from "framer-motion";
import Image from "next/image";

interface ArticleSectionProps {
    alignment: "left" | "right";
    description: string;
    title: string;
    image: string;
    index: number;
}

const ArticleSection = ({ alignment, description, title, image, index }: ArticleSectionProps) => {
    return (
        <section
            key={index}
            className={`py-16 ${index % 2 === 0 ? "bg-[var(--surface-light)]" : "bg-white"
                } relative overflow-hidden`}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-light)] to-transparent opacity-5 z-0"
                animate={{
                    opacity: [0.05, 0.1, 0.05],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
            />

            <div className="container mx-auto px-6">
                <motion.div
                    className={`flex flex-col ${alignment === "right"
                        ? "md:flex-row"
                        : "md:flex-row-reverse"
                        } items-center gap-12`}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Text Content */}
                    <motion.div
                        className="md:w-1/2 mb-10 md:mb-0"
                        initial={{
                            opacity: 0,
                            x: alignment === "right" ? -30 : 30,
                        }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                        >
                            <h3 className="text-3xl font-bold mb-4 text-[var(--foreground)]">
                                <span className="gradient-text">{title}</span>
                            </h3>
                        </motion.div>

                        <motion.p
                            className="text-gray-600 mb-8 text-lg"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                        >
                            {description}
                        </motion.p>

                        <motion.button
                            className="minecraft-btn"
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 15px 30px rgba(74, 222, 128, 0.3)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.5 }}
                        >
                            Explore Collection
                        </motion.button>
                    </motion.div>

                    {/* Image */}
                    <motion.div
                        className="md:w-1/2 relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div
                            className="relative h-[300px] md:h-[400px] bg-white shadow-lg overflow-hidden"
                            style={{
                                borderRadius:
                                    index % 2 === 0
                                        ? "70% 30% 30% 70% / 60% 40% 60% 40%"
                                        : "30% 70% 70% 30% / 40% 60% 40% 60%",
                            }}
                        >
                            <motion.div
                                className="absolute inset-0"
                                animate={{
                                    rotate: [0, 2, 0, -2, 0],
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Image
                                    src={image}
                                    alt={title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
};

export default ArticleSection;