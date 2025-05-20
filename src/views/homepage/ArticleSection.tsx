import { motion } from "framer-motion";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
interface ArticleSectionProps {
    alignment: "left" | "right";
    description: string;
    title: string;
    video: string;
    index: number;
    thumbnail?: string; // Optional thumbnail image
    productSlug: string;
}

const ArticleSection = ({ alignment, description, title, video, index, thumbnail, productSlug }: ArticleSectionProps) => {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLIFrameElement>(null);
    const paragraphs = description.split("\n\n");
    const firstParagraph = paragraphs[0];
    const floatClass = alignment === "right" ? "float-right md:ml-6" : "float-left md:mr-6";

    // Extract YouTube video ID
    const getYoutubeID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeID(video);
    const thumbnailUrl = thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');

    // Handle video play
    const handleVideoPlay = () => {
        setIsPlaying(true);
        if (videoRef.current) {
            const src = videoRef.current.src;
            videoRef.current.src = `${src}${src.includes('?') ? '&' : '?'}autoplay=1`;
        }
    };

    // Animation variants for smoother and quicker animations
    const fadeInUp = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <>
            <section
                id="articles"
                key={index}
                className={`py-16 ${index % 2 === 0 ? "bg-[var(--surface-light)]" : "bg-white"} relative`}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-light)] to-transparent z-0"
                    animate={{
                        opacity: [0.03, 0.06, 0.03],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />

                <div className="container mx-auto">
                    <motion.div
                        className="relative"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        {/* Title */}
                        <motion.div
                            className="mb-8 text-center md:text-left md:w-4/5 mx-auto"
                            variants={fadeInUp}
                        >
                            <motion.h3
                                className="text-3xl font-bold mb-4 text-[var(--foreground)]"
                                variants={fadeInUp}
                            >
                                <span className="gradient-text">{title}</span>
                            </motion.h3>
                        </motion.div>

                        {/* Video and content layout */}
                        <motion.div 
                            className="md:w-4/5 mx-auto mb-8 overflow-hidden"
                            variants={fadeInUp}
                        >
                            {/* Video with custom thumbnail */}
                            <div className={`relative rounded-lg w-full md:w-1/2 ${floatClass} mb-4 overflow-hidden`}>
                                {!isPlaying && thumbnailUrl ? (
                                    <div className="relative aspect-video w-full cursor-pointer" onClick={handleVideoPlay}>
                                        <Image 
                                            src={thumbnailUrl} 
                                            alt={title} 
                                            layout="fill"
                                            objectFit="cover"
                                            className="rounded-lg"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-[var(--primary)] border-b-[10px] border-b-transparent ml-1.5" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video">
                                        <iframe
                                            ref={videoRef}
                                            src={video}
                                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Text content */}
                            <motion.p
                                className="text-gray-600 text-lg mb-4"
                                variants={fadeInUp}
                            >
                                {firstParagraph}
                            </motion.p>

                            {paragraphs.length > 1 && (
                                <motion.p className="text-gray-600 text-lg mb-4" variants={fadeInUp}>
                                    {paragraphs[1]}
                                </motion.p>
                            )}

                            {paragraphs.length > 2 && (
                                <motion.p className="text-gray-600 text-lg mb-4" variants={fadeInUp}>
                                    {paragraphs[2]}
                                </motion.p>
                            )}

                            {/* If there's a 4th paragraph, render it below both */}
                            {paragraphs.length > 3 && (
                                <motion.p 
                                    className="clear-both text-gray-600 text-lg mt-4"
                                    variants={fadeInUp}
                                >
                                    {paragraphs[3]}
                                </motion.p>
                            )}
                            
                            {/* Clearfix to handle float properly */}
                            <div className="clear-both"></div>
                        </motion.div>

                        <div className="mt-6 gap-4 flex justify-center">
                            <motion.button
                                className="minecraft-btn"
                                whileHover={{
                                    scale: 1.03,
                                    boxShadow: "0 10px 20px rgba(74, 222, 128, 0.2)",
                                    transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                                variants={fadeInUp}
                                onClick={() => setShowModal(true)}
                            >
                                Read More
                            </motion.button>
                            <motion.button
                                className="minecraft-btn"
                                whileHover={{
                                    scale: 1.03,
                                    boxShadow: "0 10px 20px rgba(74, 222, 128, 0.2)",
                                    transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                                variants={fadeInUp}
                                onClick={() => router.push(`/shop/${productSlug}`)}
                            >
                                Purchase Now
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </section >

            {showModal && (
                <div className="fixed inset-0 backdrop-blur-md bg-white/30 z-50 flex items-center justify-center p-4">
                    <motion.div
                        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                                    <span className="gradient-text">{title}</span>
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Video at the top of modal */}
                            <div className="mb-6 aspect-video relative">
                                {!isPlaying && thumbnailUrl ? (
                                    <div className="relative aspect-video w-full cursor-pointer" onClick={handleVideoPlay}>
                                        <Image 
                                            src={thumbnailUrl} 
                                            alt={title} 
                                            layout="fill"
                                            objectFit="cover"
                                            className="rounded-lg"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                                                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[22px] border-l-[var(--primary)] border-b-[12px] border-b-transparent ml-2" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={video}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded-lg">
                                    </iframe>
                                )}
                            </div>

                            {/* Full article content */}
                            <div className="prose max-w-none">
                                {description.split('\n\n').map((paragraph, i) => (
                                    <p key={i} className="mb-4 text-gray-600 text-xl">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="minecraft-btn"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};

export default ArticleSection;