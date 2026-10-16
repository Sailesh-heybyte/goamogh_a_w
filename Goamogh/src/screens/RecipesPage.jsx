'use client';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { Clock, Users, ChevronRight, X, Sparkles } from 'lucide-react';

const recipes = [
    {
        id: 1,
        title: 'Goamogh Turmeric Milk',
        category: 'Morning Rituals',
        themeColor: 'rgba(216, 182, 106, 0.15)',
        time: '5 min',
        serves: '1 Person',
        image: '/images/turmeric.webp',
        description: 'A warm, comforting start to the day with the earthy character of turmeric.',
        ingredients: [
            '250 ml warm milk or water',
            '1/2 tsp Goamogh Turmeric',
            '1/8 tsp freshly ground black pepper',
            'Optional: a little honey',
        ],
        whySpecial:
            "Turmeric isn't just golden. It is warmth, color and depth. Paired with a pinch of black pepper, its natural aroma and curcuminoids are unlocked for daily wellness.",
        preparation: [
            'Heat 250 ml milk or water in a saucepan until warm.',
            'Stir in 1/2 tsp Goamogh Turmeric and 1/8 tsp freshly cracked black pepper.',
            'Simmer gently for 2-3 minutes to allow the spices to bloom.',
            'Pour into a mug, cool slightly, and sweeten with honey if desired.',
        ],
    },
    {
        id: 2,
        title: 'Spiced Red Chilli Curry',
        category: 'Everyday Favourites',
        themeColor: 'rgba(185, 50, 50, 0.15)',
        time: '20 min',
        serves: '3–4 People',
        image: '/images/Chilli.webp',
        description: 'A bold, comforting curry where red chilli brings color and warmth without overwhelming the dish.',
        ingredients: [
            '1 tsp Goamogh Red Chilli Powder',
            '1 tsp Goamogh Coriander Powder',
            '2 Onions, sliced',
            '2 Tomatoes, chopped',
            'Mustard oil',
        ],
        whySpecial:
            "Chilli isn't simply heat. It brings vibrant natural red color, fragrance and character to the entire dish when stone-ground from sun-dried peppers.",
        preparation: [
            'Sauté finely sliced onions in hot mustard oil until golden brown.',
            'Add ginger-garlic paste, chopped tomatoes, and cook until oil separates.',
            'Stir in Goamogh Red Chilli powder and coriander powder with a splash of water.',
            'Add vegetables or protein and simmer gently until tender.',
        ],
    },
    {
        id: 3,
        title: 'Golden Black Pepper Tonic',
        category: 'Metabolic Sips',
        themeColor: 'rgba(216, 182, 106, 0.2)',
        time: '5 min',
        serves: '1 Person',
        image: '/images/turmeric.webp',
        description:
            'A warm, bright morning drink with earthy turmeric, a gentle pepper kick and the warmth of cinnamon.',
        ingredients: [
            '250 ml warm water',
            '1/2 tsp Goamogh Turmeric',
            '1/8 tsp freshly ground black pepper',
            '1 small piece Goamogh Cinnamon',
            '1/2 tsp lemon juice',
        ],
        whySpecial:
            'A culinary infusion combining piperine from black pepper and curcuminoids from turmeric into a daily refreshing tonic.',
        preparation: [
            'Simmer turmeric, black pepper and cinnamon stick in water for 3–4 minutes.',
            'Strain into a glass and allow to cool slightly.',
            'Finish with fresh lemon juice and a touch of raw honey if desired.',
        ],
    },
    {
        id: 4,
        title: 'Cinnamon Clove Metabolic Chai',
        category: 'Metabolic Sips',
        themeColor: 'rgba(141, 115, 78, 0.2)',
        time: '8 min',
        serves: '2 People',
        image: '/images/cardomom.webp',
        description: 'Think masala chai—but lighter, cleaner and without the sugar-heavy profile.',
        ingredients: [
            '250 ml water',
            '1 small Goamogh Cinnamon stick',
            '2 Goamogh Cloves',
            '2 Green Cardamom pods',
            '2 Black Peppercorns',
            'Fresh Ginger',
        ],
        whySpecial: 'Transforms whole-spice warmth into a comforting daily Indian ritual without heavy sugars.',
        preparation: [
            'Lightly crush cinnamon, cloves, cardamom pods, peppercorns, and ginger.',
            'Simmer in 250 ml water for 5 minutes until deeply aromatic.',
            'Strain into cups. Add a small splash of milk or jaggery if desired.',
        ],
    },
    {
        id: 5,
        title: 'Jeera Pepper Digestive Water',
        category: 'Metabolic Sips',
        themeColor: 'rgba(160, 140, 90, 0.18)',
        time: '10 min',
        serves: '2 People',
        image: '/images/Cumin Powder.webp',
        description: 'A very simple Indian-inspired infusion for after a meal.',
        ingredients: [
            '300 ml water',
            '1 tsp lightly roasted cumin',
            '2 black peppercorns, crushed',
            '1/2 tsp lemon juice',
            'Pinch of black salt',
        ],
        whySpecial:
            "Cumin isn't just earthy—it is the first crackle of flavor. Paired with pepper and black salt, it makes an ideal post-meal infusion.",
        preparation: [
            'Lightly roast cumin seeds in a dry pan until fragrant.',
            'Steep the roasted cumin and crushed pepper in hot water for 7–8 minutes.',
            'Strain, add fresh lemon juice and a pinch of black salt before serving.',
        ],
    },
    {
        id: 6,
        title: 'Kashmiri Dum Aloo',
        category: 'North India Main Course',
        themeColor: 'rgba(180, 80, 50, 0.2)',
        time: '50 min',
        serves: '4 People',
        image: '/images/Chilli.webp',
        description:
            'Deep color. Gentle heat. Baby potatoes slowly cooked in a fragrant yoghurt-based gravy with Kashmiri chilli & fennel.',
        ingredients: [
            '500g baby potatoes',
            '1.5 tsp Goamogh Kashmiri Chilli',
            '1 tsp Fennel powder',
            '1/2 tsp Cumin powder',
            '1/2 tsp Black pepper',
            '1 Cinnamon stick',
            '2 Cloves',
            '1 cup Yoghurt',
        ],
        whySpecial:
            'Kashmiri chilli is prized for its vibrant red color and moderate heat. Dum cooking allows the potatoes to absorb the aromatic gravy slowly.',
        preparation: [
            'Boil baby potatoes until tender, peel, and prick with a fork. Fry in mustard oil until golden.',
            'Whisk yoghurt with Kashmiri chilli powder, fennel powder, cumin, and ginger powder.',
            'Sauté cinnamon, cloves, cardamom and bay leaf in pan. Add yoghurt mixture over low heat, stirring continuously.',
            'Add potatoes and 1 cup water. Cover and simmer gently (dum) for 20–25 minutes until rich and thick.',
        ],
    },
    {
        id: 7,
        title: 'Punjabi Black Pepper Chicken',
        category: 'North India Main Course',
        themeColor: 'rgba(140, 100, 60, 0.2)',
        time: '1 hr',
        serves: '4 People',
        image: '/images/Cumin Powder.webp',
        description:
            'Bold pepper. Slow-cooked comfort. A hearty chicken curry built around freshly ground black pepper and caramelised onions.',
        ingredients: [
            '750g chicken',
            '1.5 tsp Goamogh Black Pepper',
            '1 tsp Turmeric',
            '1 tsp Coriander powder',
            '1/2 tsp Cumin powder',
            '2 large onions',
            'Yoghurt',
        ],
        whySpecial:
            'Freshly cracked black pepper brings a lingering, woody warmth that leads the curry alongside deeply browned onions.',
        preparation: [
            'Marinate chicken with yoghurt, turmeric, black pepper, ginger-garlic and lemon juice for 30 minutes.',
            'Sauté sliced onions in mustard oil until deeply caramelised brown.',
            'Add ginger-garlic paste, coriander, cumin and chilli powder with a splash of water until oil separates.',
            'Add marinated chicken, cook for 8 minutes, add hot water and simmer covered for 25 minutes. Finish with freshly cracked black pepper.',
        ],
    },
    {
        id: 8,
        title: 'Chettinad Pepper Chicken',
        category: 'South India Main Course',
        themeColor: 'rgba(160, 90, 40, 0.2)',
        time: '1 hr',
        serves: '4 People',
        image: '/images/Cumin Powder.webp',
        description:
            'Roasted spices. Serious pepper. Full-bodied Chettinad flavor built from whole roasted spices and freshly cracked pepper.',
        ingredients: [
            '750g chicken',
            '1.5 tsp Goamogh Black Peppercorns',
            '1 tsp Cumin',
            '1 tsp Coriander seeds',
            '1 Cinnamon stick',
            '3 Cloves',
            'Star anise',
            'Fennel',
            'Fresh Coconut',
        ],
        whySpecial:
            'Chettinad cooking builds flavor in layers. Gently roasting whole spices releases their aroma before grinding them into a coarse masala.',
        preparation: [
            'Dry roast black pepper, cumin, coriander seeds, cinnamon, cloves, cardamom, star anise, fennel and red chillies. Add grated coconut and roast until fragrant. Grind to a coarse paste.',
            'Marinate chicken with turmeric, pepper, ginger-garlic and salt.',
            'Heat sesame oil, crackle curry leaves, sauté onions, ginger-garlic and tomatoes.',
            'Add chicken and ground Chettinad masala. Simmer covered for 25 minutes. Finish with freshly cracked black pepper and curry leaves.',
        ],
    },
    {
        id: 9,
        title: 'Kerala Pepper & Coconut Fish Curry',
        category: 'South India Main Course',
        themeColor: 'rgba(80, 140, 100, 0.2)',
        time: '45 min',
        serves: '4 People',
        image: '/images/cardomom.webp',
        description:
            'Coastal comfort. Pepper warmth. Coconut softness. A gently spiced fish curry where pepper meets rich coconut milk.',
        ingredients: [
            '600g fish fillets',
            '1.5 tsp Goamogh Black Pepper',
            '1 tsp Turmeric',
            '1 cup thin coconut milk',
            '1/2 cup thick coconut milk',
            'Shallots',
            'Curry leaves',
            'Coconut oil',
        ],
        whySpecial:
            'Black pepper is used for warmth rather than overwhelming heat, balanced by the mellow richness of coconut milk.',
        preparation: [
            'Season fish with turmeric, black pepper, lemon juice and salt. Set aside for 20 minutes.',
            'Heat coconut oil, sauté cinnamon, cloves, curry leaves, ginger, garlic, green chillies and shallots.',
            'Add turmeric, black pepper, tomatoes, and thin coconut milk. Bring to a gentle simmer for 7 minutes.',
            'Add fish fillets, cover and cook for 8 minutes without aggressive stirring. Finish with thick coconut milk, cracked pepper, and coconut oil.',
        ],
    },
];

const MagneticCard = ({ children, className = '' }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    const springConfig = { stiffness: 150, damping: 20 };
    const springX = useSpring(rotateX, springConfig);
    const springY = useSpring(rotateY, springConfig);

    function handleMouseMove(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
            className={`relative ${className}`}
        >
            {children}
        </motion.div>
    );
};

const RecipeCard = ({ recipe, index, onClick, onHover }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => onHover(recipe.themeColor)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(recipe)}
            className="group cursor-pointer relative overflow-hidden rounded-[24px] md:rounded-[40px] liquid-glass border border-[#d8b66a]/10 hover:border-[#d8b66a]/40 transition-all duration-700"
        >
            <div className="absolute top-0 left-0 z-10 p-6 md:p-10 pr-20 md:pr-24 flex items-center gap-3">
                <div className="h-px w-6 bg-[#e2c27a]" />
                <span className="text-[11px] uppercase tracking-[0.4em] eyebrow-gold">{recipe.category}</span>
            </div>

            <div className="aspect-[4/5] overflow-hidden">
                <motion.img
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b150d] via-[#0b150d]/40 to-transparent opacity-90" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0b150d]/80 to-transparent pointer-events-none" />
            </div>

            <div className="absolute bottom-0 p-6 md:p-10 w-full transform group-hover:translate-y-[-8px] transition-transform duration-500">
                <h3 className="font-display text-2xl md:text-4xl text-[#f2e7c8] mb-4 md:mb-6 group-hover:text-[#d8b66a] transition-colors duration-500">
                    {recipe.title}
                </h3>

                <div className="flex items-center gap-6 md:gap-8 text-[#d6cca9]/70 text-[10px] uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-[#d8b66a]" />
                        <span>{recipe.time}</span>
                    </div>
                </div>
            </div>

            <motion.div className="absolute top-6 right-6 h-10 w-10 md:h-14 md:w-14 rounded-full bg-[#d8b66a] text-[#1a2416] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl">
                <ChevronRight size={20} className="md:w-6 md:h-6" />
            </motion.div>
        </motion.div>
    );
};

const RecipeModal = ({ recipe, onClose }) => {
    useEffect(() => {
        if (!recipe) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [recipe]);

    if (!recipe) return null;

    return (
        <motion.div
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0b150d]/90 backdrop-blur-xl overflow-y-auto"
        >
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-full max-w-4xl max-h-[82vh] bg-[#1a2416] rounded-3xl border border-[#d8b66a]/30 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] my-auto flex flex-col lg:flex-row"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 border border-white/15 text-white flex items-center justify-center hover:bg-[#d8b66a] hover:text-[#1a2416] transition-all duration-300 group z-50 shadow-lg"
                >
                    <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="relative lg:w-5/12 h-[220px] sm:h-[280px] lg:h-auto bg-[#0d160f] flex items-center justify-center p-6 flex-shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,182,106,0.18)_0,transparent_70%)] pointer-events-none" />

                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        src={recipe.image}
                        className="max-h-full max-w-full object-contain relative z-10 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-500"
                        alt={recipe.title}
                    />

                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#1a2416] to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#1a2416] to-transparent hidden lg:block pointer-events-none" />
                </div>

                <div
                    data-lenis-prevent
                    className="lg:w-7/12 p-6 md:p-8 lg:p-10 max-h-[82vh] overflow-y-auto custom-scrollbar bg-[#1a2416]"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6 border-b border-white/10 pb-5"
                    >
                        <span className="text-[10px] uppercase tracking-[0.35em] eyebrow-gold font-bold mb-1.5 block">
                            Legacy Selection
                        </span>
                        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[#f2e7c8] leading-tight mb-3">
                            {recipe.title}
                        </h2>

                        <div className="flex gap-6 items-center">
                            <div className="flex items-center gap-2 text-[#d6cca9]">
                                <Clock size={14} className="text-[#d8b66a]" />
                                <span className="text-xs font-bold tracking-widest uppercase">{recipe.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#d6cca9]">
                                <Users size={14} className="text-[#d8b66a]" />
                                <span className="text-xs font-bold tracking-widest uppercase">{recipe.serves}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px w-8 bg-[#d8b66a]" />
                            <span className="text-[9px] uppercase tracking-[0.35em] eyebrow-gold font-bold">
                                The Artisanal Secret
                            </span>
                        </div>
                        <p className="text-sm sm:text-base text-[#f2e7c8] font-medium leading-relaxed font-serif">
                            "{recipe.whySpecial}"
                        </p>
                    </motion.div>

                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px w-8 bg-[#d8b66a]" />
                            <span className="text-[9px] uppercase tracking-[0.35em] eyebrow-gold font-bold">
                                The Preparation Ritual
                            </span>
                        </div>
                        <div className="space-y-4">
                            {recipe.preparation.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="flex gap-4 group"
                                >
                                    <span className="text-[#d8b66a] font-display text-2xl opacity-30 group-hover:opacity-80 transition-opacity duration-300">
                                        0{i + 1}
                                    </span>
                                    <p className="text-[#d6cca9] text-xs sm:text-sm leading-relaxed pt-1 border-l border-white/10 pl-4 group-hover:border-[#d8b66a]/40 transition-colors duration-300">
                                        {step}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button className="w-full py-3.5 bg-[#d8b66a] text-[#1a2416] rounded-full font-bold text-sm sm:text-base hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-[0_10px_30px_rgba(216,182,106,0.25)] flex items-center justify-center gap-3 group">
                            Acquire This Heritage Blend
                            <ChevronRight
                                size={18}
                                className="group-hover:translate-x-1.5 transition-transform duration-300"
                            />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

function MortarPestleIcon({ className = 'w-7 h-7' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 4l-6.5 9" />
            <path d="M4 11h16" />
            <path d="M5 11c.5 4.5 3.5 7 7 7s6.5-2.5 7-7" />
            <path d="M9 18h6" />
        </svg>
    );
}

function SpiceLeavesIcon({ className = 'w-7 h-7' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7 19c2-5 6-10 12-11-1 6-5 10-10 11-1 0-1.5-.5-2 0z" />
            <path d="M10 14l5-4" />
            <path d="M7 15c-2-1-3.5-3-3.5-5 2.5 0 4.5 1.5 5 4" />
        </svg>
    );
}

function BotanicalSprigIcon({ className = 'w-7 h-7' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 21v-9" />
            <path d="M12 12c-1.5-2.5-1.5-5.5 0-8 1.5 2.5 1.5 5.5 0 8z" />
            <path d="M12 10V6" />
            <path d="M12 14c-3-.5-5.5-2.5-5.5-5 2.5 0 4.5 2 5.5 5z" />
            <path d="M12 14c3-.5 5.5-2.5 5.5-5-2.5 0-4.5 2-5.5 5z" />
        </svg>
    );
}

function SpiceJarIcon({ className = 'w-7 h-7' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="8" y="4" width="8" height="2.5" rx="1" />
            <path d="M7 6.5h10" />
            <path d="M7.5 7.5C7.5 9 6 10 6 12v7c0 1.5 1 2.5 2.5 2.5h7c1.5 0 2.5-1 2.5-2.5v-7c0-2-1.5-3-1.5-4.5" />
        </svg>
    );
}

export default function RecipesPage() {
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [hoveredColor, setHoveredColor] = useState(null);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 1.08]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
    const heroTranslateY = useTransform(smoothProgress, [0, 0.15], [0, -50]);

    return (
        <main
            ref={containerRef}
            className="text-[#f2e7c8] min-h-screen selection:bg-[#d8b66a] selection:text-[#1a2416] relative transition-colors duration-1000 overflow-x-hidden"
            style={{ backgroundColor: hoveredColor ? hoveredColor : '#1a2416' }}
        >
            <div className="relative z-10">
                <div className="noise-overlay" />

                <AnimatePresence>
                    {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
                </AnimatePresence>

                <div className="relative h-[150vh] z-10">
                    <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
                        <motion.div
                            style={{
                                scale: heroScale,
                                opacity: heroOpacity,
                                y: heroTranslateY,
                                willChange: 'transform, opacity',
                            }}
                            className="absolute inset-0 z-0"
                        >
                            <Image
                                src="/images/option-1.webp"
                                alt="Heritage Background"
                                fill
                                priority
                                sizes="100vw"
                                className="object-cover opacity-45 scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1a2416]/85 via-transparent to-[#1a2416]/92" />
                        </motion.div>

                        <div className="relative z-10 text-center px-6 pt-20 md:pt-28">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                style={{ opacity: heroOpacity, y: heroTranslateY }}
                            >
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <div className="h-px w-10 bg-[#d8b66a]/35" />
                                    <span className="text-[9px] uppercase tracking-[0.42em] eyebrow-gold font-semibold">
                                        RECIPE ARCHIVE
                                    </span>
                                    <div className="h-px w-10 bg-[#d8b66a]/35" />
                                </div>
                                <h1 className="font-display text-[clamp(2.1rem,6vw,5.5rem)] leading-[0.95] tracking-tighter text-[#f2e7c8] uppercase">
                                    THE RECIPES WE REMEMBER. <br />
                                    <span className="text-[#d8b66a]">THE FLAVORS WE RETURN TO.</span>
                                </h1>
                                <p className="mt-7 max-w-xl lg:max-w-[64rem] text-balance mx-auto text-[#d6cca9] text-sm md:text-base leading-relaxed font-serif opacity-80">
                                    Some dishes live in cookbooks. Others live in memory—the crackle of cumin in hot
                                    oil, the warmth of Chilies, the aroma that reaches the next room before the food
                                    does. Explore recipes rooted in Indian kitchens, made for the way we cook today.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 2, delay: 1.5 }}
                                style={{ opacity: heroOpacity }}
                                className="mt-20 flex flex-col items-center gap-5"
                            >
                                <div className="w-px h-20 bg-gradient-to-b from-[#d8b66a] via-[#d8b66a]/40 to-transparent" />
                                <span className="text-[9px] uppercase tracking-[0.4em] eyebrow-gold">
                                    EXPLORE THE RECIPES ↓
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <section className="py-24 md:py-36 px-6 md:px-12 max-w-[1700px] mx-auto relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7">
                            <MagneticCard className="h-full">
                                <div className="relative rounded-[32px] md:rounded-[48px] bg-[#4a5f3a] p-7 md:p-12 lg:p-14 overflow-hidden border border-[#d8b66a]/20 group h-full flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-gradient-to-bl from-[#d8b66a]/5 to-transparent pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                                            <Sparkles size={16} className="text-[#d8b66a]" />
                                            <span className="text-[11px] uppercase tracking-[0.35em] text-[#d8b66a] font-bold">
                                                KNOW YOUR SPICE
                                            </span>
                                        </div>
                                        <h2 className="font-display text-4xl md:text-6xl text-[#f2e7c8] mb-6 md:mb-8 leading-[1.02]">
                                            Every Spice <br />{' '}
                                            <span className="text-[#d8b66a] font-serif">Has a Role</span>
                                        </h2>
                                        <p className="text-[#d6cca9] text-sm md:text-base leading-relaxed max-w-2xl opacity-90 mb-10 md:mb-12">
                                            Cumin isn't just earthy—it is the first crackle in hot oil. Turmeric isn't
                                            just golden—it is warmth, color and depth. Chilli isn't simply heat—it
                                            brings fragrance and character to the entire dish.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2">
                                            <div className="md:pr-8 md:border-r border-[#d8b66a]/25 flex flex-col justify-between">
                                                <div className="pb-7 border-b border-[#d8b66a]/25">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <MortarPestleIcon className="w-7 h-7 text-[#d8b66a] shrink-0" />
                                                        <div className="h-6 w-px bg-[#d8b66a]/30 shrink-0" />
                                                        <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#d8b66a]">
                                                            THE ART OF BALANCE
                                                        </h4>
                                                    </div>
                                                    <p className="text-[#d6cca9]/90 text-xs md:text-[13px] leading-relaxed">
                                                        Whole spices release their aroma in hot oil. Ground spices
                                                        deepen the flavor as they cook. Add delicate spices later to
                                                        preserve their fragrance.
                                                    </p>
                                                </div>

                                                <div className="pt-7 pb-7 md:pb-0 border-b md:border-b-0 border-[#d8b66a]/25">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <BotanicalSprigIcon className="w-7 h-7 text-[#d8b66a] shrink-0" />
                                                        <div className="h-6 w-px bg-[#d8b66a]/30 shrink-0" />
                                                        <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#d8b66a]">
                                                            FROM ORIGIN TO KITCHEN
                                                        </h4>
                                                    </div>
                                                    <p className="text-[#d6cca9]/90 text-xs md:text-[13px] leading-relaxed">
                                                        Each spice carries a story of soil, climate and careful harvest.
                                                        Thoughtful sourcing and small-batch processing help preserve its
                                                        natural character.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="md:pl-8 flex flex-col justify-between pt-7 md:pt-0">
                                                <div className="pb-7 border-b border-[#d8b66a]/25">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <SpiceLeavesIcon className="w-7 h-7 text-[#d8b66a] shrink-0" />
                                                        <div className="h-6 w-px bg-[#d8b66a]/30 shrink-0" />
                                                        <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#d8b66a]">
                                                            A LITTLE SPICE KNOW-HOW
                                                        </h4>
                                                    </div>
                                                    <ul className="space-y-1.5 text-xs md:text-[13px] text-[#d6cca9]/90">
                                                        <li className="flex items-baseline gap-2">
                                                            <span className="text-[#d8b66a] text-sm leading-none">
                                                                •
                                                            </span>
                                                            <span>
                                                                <strong className="text-[#d8b66a] font-bold">
                                                                    Cumin:
                                                                </strong>{' '}
                                                                earthy warmth and a nutty aroma
                                                            </span>
                                                        </li>
                                                        <li className="flex items-baseline gap-2">
                                                            <span className="text-[#d8b66a] text-sm leading-none">
                                                                •
                                                            </span>
                                                            <span>
                                                                <strong className="text-[#d8b66a] font-bold">
                                                                    Turmeric:
                                                                </strong>{' '}
                                                                golden color and gentle depth
                                                            </span>
                                                        </li>
                                                        <li className="flex items-baseline gap-2">
                                                            <span className="text-[#d8b66a] text-sm leading-none">
                                                                •
                                                            </span>
                                                            <span>
                                                                <strong className="text-[#d8b66a] font-bold">
                                                                    Coriander:
                                                                </strong>{' '}
                                                                citrusy freshness and balance
                                                            </span>
                                                        </li>
                                                        <li className="flex items-baseline gap-2">
                                                            <span className="text-[#d8b66a] text-sm leading-none">
                                                                •
                                                            </span>
                                                            <span>
                                                                <strong className="text-[#d8b66a] font-bold">
                                                                    Chilli:
                                                                </strong>{' '}
                                                                vibrant color, aroma and heat
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="pt-7">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <SpiceJarIcon className="w-7 h-7 text-[#d8b66a] shrink-0" />
                                                        <div className="h-6 w-px bg-[#d8b66a]/30 shrink-0" />
                                                        <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#d8b66a]">
                                                            COOK WITH INTENTION
                                                        </h4>
                                                    </div>
                                                    <p className="text-[#d6cca9]/90 text-xs md:text-[13px] leading-relaxed">
                                                        Bloom whole spices first, toast gently, and store powders in
                                                        airtight containers away from heat, light and moisture.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 md:mt-12 relative z-10">
                                        <span className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-[#d8b66a] font-mono hover:text-[#f2e7c8] transition-colors cursor-pointer inline-flex items-center gap-2">
                                            UNDERSTAND WHAT MAKES IT WORK →
                                        </span>
                                    </div>
                                </div>
                            </MagneticCard>
                        </div>

                        <div className="lg:col-span-5 grid grid-rows-2 gap-8">
                            <MagneticCard>
                                <div className="rounded-[32px] md:rounded-[60px] bg-[#d8b66a] p-6 md:p-12 flex flex-col justify-center text-[#1a2416] h-full relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <span className="text-[10px] uppercase tracking-[0.4em] eyebrow-gold font-bold mb-2">
                                        COOKING WITH SPICES
                                    </span>
                                    <h3 className="font-display text-2xl md:text-4xl mb-3 leading-tight">
                                        When to Add the Spice <br />{' '}
                                        <span className="font-serif">Changes Everything</span>
                                    </h3>
                                    <p className="text-[#1a2416]/80 text-xs md:text-sm leading-relaxed font-medium">
                                        Add cumin to hot oil and listen for the crackle. Bloom turmeric gently. Let
                                        coriander cook into the base. Bring chilli in at the right moment.
                                    </p>
                                </div>
                            </MagneticCard>

                            <MagneticCard>
                                <div className="rounded-[32px] md:rounded-[60px] border border-[#d8b66a]/20 bg-[#4a5f3a] p-6 md:p-12 flex flex-col justify-center relative overflow-hidden h-full group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-px w-8 bg-[#d8b66a]" />
                                        <span className="text-[10px] uppercase tracking-[0.4em] eyebrow-gold font-bold">
                                            KITCHEN GUIDES
                                        </span>
                                    </div>
                                    <h3 className="font-display text-2xl md:text-4xl mb-4 text-[#f2e7c8]">
                                        Learn Your Spices. <br />{' '}
                                        <span className="text-[#d8b66a] font-serif">Cook With Confidence.</span>
                                    </h3>
                                    <ul className="space-y-2 text-[#d6cca9] text-xs md:text-sm font-medium">
                                        {[
                                            'How to Use Turmeric in Everyday Cooking',
                                            'How to Cook With Cumin',
                                            "Cumin vs Coriander: What's the Difference?",
                                            'How to Store Indian Spices',
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 group/item cursor-pointer">
                                                <div className="h-1.5 w-1.5 bg-[#d8b66a] rounded-full group-hover/item:scale-[2] transition-transform duration-300" />
                                                <span className="group-hover/item:text-[#d8b66a] transition-colors duration-300">
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </MagneticCard>
                        </div>
                    </div>
                </section>

                <section className="py-20 md:py-32 px-6 md:px-12 max-w-[1700px] mx-auto relative z-20">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-px w-12 bg-[#d8b66a]" />
                                <span className="text-[10px] uppercase tracking-[0.4em] eyebrow-gold font-bold">
                                    FROM THE GOAMOGH KITCHEN
                                </span>
                            </div>
                            <h2 className="font-display text-4xl md:text-7xl text-[#f2e7c8] leading-[0.9]">
                                Recipes Worth <br /> <span className="text-[#d8b66a] font-serif">Coming Back To</span>
                            </h2>
                            <p className="text-[#d6cca9] text-sm md:text-base mt-4 font-serif opacity-80">
                                We believe the best recipes are not complicated. They are the ones you make once,
                                remember forever, and eventually stop needing the recipe for.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {recipes.map((recipe, index) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                index={index}
                                onClick={setSelectedRecipe}
                                onHover={setHoveredColor}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
