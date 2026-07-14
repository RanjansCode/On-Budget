/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Product, Reel } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'tech', name: 'Tech & Gadgets', icon: 'Cpu' },
  { id: 'gaming', name: 'Gaming Hub', icon: 'Gamepad2' },
  { id: 'desk-setup', name: 'Desk Setups', icon: 'Layout' },
  { id: 'mobile-accessories', name: 'Mobile Accessories', icon: 'Smartphone' },
  { id: 'laptop-accessories', name: 'Laptop Accessories', icon: 'Laptop' },
  { id: 'home', name: 'Home & Decor', icon: 'Home' },
  { id: 'kitchen', name: 'Kitchen Gadgets', icon: 'Utensils' },
  { id: 'fashion', name: 'Fashion & Apparel', icon: 'Shirt' },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: 'Sparkles' },
  { id: 'study-essentials', name: 'Study Essentials', icon: 'BookOpen' },
  { id: 'office-essentials', name: 'Office Essentials', icon: 'Briefcase' },
  { id: 'smart-gadgets', name: 'Smart Home Gadgets', icon: 'Zap' },
  { id: 'fitness', name: 'Fitness & Outdoors', icon: 'Dumbbell' },
  { id: 'travel', name: 'Travel Essentials', icon: 'Compass' },
  { id: 'pet-accessories', name: 'Pet Accessories', icon: 'Footprints' },
  { id: 'car-accessories', name: 'Car Accessories', icon: 'Car' },
  { id: 'storage', name: 'Storage & Organizers', icon: 'FolderOpen' },
  { id: 'lighting', name: 'Ambient Lighting', icon: 'Sun' },
  { id: 'accessories', name: 'Daily Accessories', icon: 'Glasses' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Minimalist Magnetic Cable Organizer',
    price: 99,
    originalPrice: 199,
    discount: 50,
    description: 'Keep your charging cables organized and clutter-free with this premium magnetic cable organizer. Includes 3 magnetic clips that attach securely to the silicone base, preventing cables from slipping off your desk.',
    whyIRecommend: 'For just ₹99, this is an absolute game-changer. Standard adhesive cable clips wear off, but this magnetic base stays put and allows you to attach and detach wires effortlessly.',
    brand: 'TidyUp',
    category: 'desk-setup',
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541140111869-aa590cb9b06d?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-working-with-various-tools-and-devices-on-desk-43301-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-magnetic-organizer' },
      { platform: 'Meesho', url: 'https://meesho.com/mock-magnetic-organizer' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: true,
      trending: false
    },
    creatorReview: {
      rating: 5,
      reviewText: 'Honestly, I was skeptical about a ₹99 cable organizer, but this magnetic solution exceeded all my expectations. The base has a strong 3M adhesive that does not damage the wood desk, and the magnets hold heavy USB-C cables with ease.',
      unboxingText: 'It comes in a very compact cardboard box. You get one main matte silicone desk base and 3 magnetic collar clips for your cables.',
      setupGuideText: '1. Clean your desk surface. 2. Peel off the 3M tape. 3. Firmly press the base for 10 seconds. 4. Wrap the magnetic clips around your cables.',
      myExperience: 'I have been using it for 3 months now. It keeps my workstation clean. I no longer have to bend down to pick up my dropped phone charger!',
      myVerdict: 'An absolute steal for ₹99. Stop looking at expensive wire racks and buy this instead.',
      photos: [
        'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=400&auto=format&fit=crop&q=80'
      ]
    },
    pros: ['Very strong magnets', 'Extremely affordable', 'Heavy-duty 3M sticky pad', 'Sleek matte finish'],
    cons: ['Fits standard cable thickness only', 'Magnetic clips are small and easy to lose'],
    specifications: [
      { name: 'Material', value: 'Liquid Silicone + Neodymium Magnets' },
      { name: 'Base Dimensions', value: '9cm x 2cm' },
      { name: 'Clip Capacity', value: '3 Cables (up to 4.5mm diameter)' }
    ],
    features: ['Universal Cable Support', 'Re-usable Sticky Pad', 'Premium Desk Accent'],
    couponCode: 'CABLE5',
    alternatives: ['Anker Magnetic Cable Holder (costly ₹699)'],
    frequentlyBoughtTogether: ['prod-3'],
    faqs: [
      { question: 'Will this hold thick HDMI cables?', answer: 'No, it is designed for smartphone charging and USB-C cables up to 4.5mm.' },
      { question: 'Is the adhesive reusable?', answer: 'Yes, if washed carefully and air-dried, it retains some stickiness, but we recommend placing it once.' }
    ],
    reelId: 'reel-1',
    status: 'Published',
    createdAt: '2026-06-01T12:00:00Z'
  },
  {
    id: 'prod-2',
    title: 'Super Portable Keychain Mini LED Light (800 lm)',
    price: 89,
    originalPrice: 249,
    discount: 64,
    description: 'This mini pocket COB flashlight emits up to 800 lumens of light. Features a bottle opener, strong magnetic base, and folding stand, making it the perfect emergency tool.',
    whyIRecommend: 'At just ₹89, it fits on your keyring, can be charged via Type-C, opens bottles, and easily lights up an entire room. Seriously handy for night walks or power cuts.',
    brand: 'GlowTek',
    category: 'tech',
    rating: 4.6,
    images: [
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pocket-flashlight-lighting-up-wood-41951-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-keychain-led' },
      { platform: 'Meesho', url: 'https://meesho.com/mock-keychain-led' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: false,
      trending: true
    },
    creatorReview: {
      rating: 4,
      reviewText: 'For ₹89, this thing is surprisingly bright. It has 4 light modes (60% brightness, 30% brightness, strobe, and holding for maximum 100% brightness). The USB Type-C charging is a major plus!',
      unboxingText: 'Includes the keyring light and a small USB-A to USB-C charging cord inside a simple bubble wrap pouch.',
      setupGuideText: 'Just press the power button on the side to cycle modes. Connect any Type-C charger to recharge.',
      myExperience: 'I hung this on my car keys. I used the bottle opener at a camp-out and everybody asked where I got it. Extremely solid aluminum-like casing.',
      myVerdict: 'A must-have gadget for everyone. Buy 2 and give one to your parents for emergency safety.',
      photos: []
    },
    pros: ['Blindingly bright', 'Type-C Rechargeable', 'Magnetic mount and stand', 'Built-in bottle opener'],
    cons: ['Battery lasts only 45-60 mins on high mode', 'Gets slightly warm after continuous use'],
    specifications: [
      { name: 'Brightness', value: '800 Lumens Max' },
      { name: 'Battery', value: '500mAh Lithium Ion' },
      { name: 'Charging Port', value: 'USB Type-C' },
      { name: 'Water Resistance', value: 'IPX4 Splashproof' }
    ],
    features: ['Folding Stand', 'Strong Magnet Base', 'Tripod Mount Hole'],
    couponCode: 'BRIGHT10',
    alternatives: ['Nitecore Tiki Keychain Light (₹1,500)'],
    frequentlyBoughtTogether: [],
    faqs: [
      { question: 'Does it include a charging cable?', answer: 'Yes, a small Type-C cable is included.' }
    ],
    reelId: 'reel-2',
    status: 'Published',
    createdAt: '2026-06-10T12:00:00Z'
  },
  {
    id: 'prod-3',
    title: 'Solid Aluminum Phone Desk Stand',
    price: 189,
    originalPrice: 499,
    discount: 62,
    description: 'This premium, fully-adjustable solid aluminum desk stand holds your phone or tablet at the perfect viewing angle. Features heavy rubber pads to protect your devices from scratches and slipping.',
    whyIRecommend: 'Most stands are cheap plastic. This one is actual cold-rolled aluminum alloy, weighs enough to not tip over, and folds completely flat for travel. Total steal at under ₹199!',
    brand: 'AluStand',
    category: 'mobile-accessories',
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-man-tapping-on-his-smartphone-placed-on-desk-43308-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-phone-stand' },
      { platform: 'Flipkart', url: 'https://flipkart.com/mock-phone-stand' }
    ],
    badges: {
      seenInReel: false,
      personallyTested: true,
      recommended: true,
      trending: true
    },
    creatorReview: {
      rating: 5,
      reviewText: 'This is the stand I use in all my desk setup videos! The double hinges are tight enough to hold an iPad without sliding down. Matte metal finish matches my Mac perfectly.',
      unboxingText: 'Comes in a sleek cardboard flat-pack. Stand is pre-assembled, just unfold and enjoy.',
      setupGuideText: 'Simply unfold and adjust the dual hinges to achieve your preferred height and screen angle.',
      myExperience: 'I keep it on my nightstand. It lets me watch reels comfortably without hands falling asleep.',
      myVerdict: 'Don\'t buy plastic stands. Get this premium alloy stand and feel the luxurious weight.',
      photos: []
    },
    pros: ['All-metal build quality', 'Double hinge folding mechanism', 'Charging cable cutout slot', 'Anti-slip rubber pads'],
    cons: ['A bit heavy to carry in a pocket'],
    specifications: [
      { name: 'Material', value: 'Anodized Aluminum Alloy' },
      { name: 'Weight', value: '145 grams' },
      { name: 'Compatibility', value: '4 to 10 inch Mobile & Tablets' }
    ],
    features: ['Dual 270-degree hinges', 'Travel fold', 'Heavy metal counterweight'],
    couponCode: 'STAND15',
    alternatives: ['Lamicall Desk Stand (₹799)'],
    frequentlyBoughtTogether: ['prod-1'],
    faqs: [
      { question: 'Will this hold a tablet?', answer: 'Yes, it holds tablets up to 10 inches securely. For 12.9 inch iPads, we recommend horizontal placement.' }
    ],
    reelId: undefined,
    status: 'Published',
    createdAt: '2026-06-15T12:00:00Z'
  },
  {
    id: 'prod-4',
    title: 'Customizable Smart RGB Strip Lights (5m)',
    price: 289,
    originalPrice: 799,
    discount: 63,
    description: 'Transform your room, TV backing, or desk setup with 5 meters of bright RGB LED strip lights. Includes an IR remote control with 16 vibrant colors and multiple strobe/fade transition modes.',
    whyIRecommend: 'Most RGB strips are expensive. This is a complete 5-meter kit with adhesive backing and a power adapter for under ₹300. It brings immediate gaming aesthetic to your setup.',
    brand: 'LumiRoom',
    category: 'gaming',
    rating: 4.5,
    images: [
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-gaming-setup-with-colorful-led-lights-42284-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-rgb-strip' },
      { platform: 'Meesho', url: 'https://meesho.com/mock-rgb-strip' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: false,
      recommended: true,
      trending: true
    },
    creatorReview: {
      rating: 4,
      reviewText: 'A perfect budget starter strip. The 5050 LED diodes are bright, colors look vibrant, and the remote works through cabinets. The self-adhesive strip is moderate, but I recommend adding a bit of tape for tight corners.',
      unboxingText: 'Inside you get a 5m reel of LED strip, an IR receiver connector box, a 24-key remote control, and a wall power plug.',
      setupGuideText: '1. Plan your path and clean the wall/desk. 2. Peel adhesive backing and stick gradually. 3. Plug the pin connector (match the arrows!) 4. Turn on via remote.',
      myExperience: 'I put it behind my desktop monitor. It creates an incredible ambient glow that reduces eye fatigue when playing in the dark.',
      myVerdict: 'Unbeatable value for standard RGB. If you do not need Google Assistant app sync, this is perfect.',
      photos: []
    },
    pros: ['Very cheap for 5m length', '16 colors with remote controls', 'Cuttable every 3 LEDs to customize length'],
    cons: ['Adhesive tape could be stickier', 'Does not have smartphone app controls (remote only)'],
    specifications: [
      { name: 'Length', value: '5 Meters / 16.4 Feet' },
      { name: 'LED Type', value: 'SMD 5050 RGB' },
      { name: 'Control Type', value: '24-Key IR Remote' },
      { name: 'Input Voltage', value: '12V DC Adapter' }
    ],
    features: ['Cuttable design', 'Double-sided tape', 'Strobe & Smooth fading'],
    couponCode: 'RGBGLOW',
    alternatives: ['Wipro Smart WiFi LED Strip (₹1,499)'],
    frequentlyBoughtTogether: ['prod-7'],
    faqs: [
      { question: 'Can I cut the strip?', answer: 'Yes, there are designated scissor marks on the copper pads where you can safely cut it.' }
    ],
    reelId: 'reel-3',
    status: 'Published',
    createdAt: '2026-06-20T12:00:00Z'
  },
  {
    id: 'prod-5',
    title: 'USB Smart Coffee & Tea Mug Warmer',
    price: 199,
    originalPrice: 499,
    discount: 60,
    description: 'Keep your morning beverage perfectly hot all day. This desktop smart coaster plug-in senses when a cup is placed on it and keeps coffee, tea, or milk at a stable, cozy 55°C temperature.',
    whyIRecommend: 'If you get lost in your work or gaming sessions and find your coffee freezing, this ₹199 coaster is your new best friend. Sleek glass finish looks beautiful on any desk.',
    brand: 'CozyDesk',
    category: 'desk-setup',
    rating: 4.7,
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-hot-coffee-pouring-into-mug-on-coaster-41220-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-mug-warmer' },
      { platform: 'Flipkart', url: 'https://flipkart.com/mock-mug-warmer' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: true,
      trending: false
    },
    creatorReview: {
      rating: 5,
      reviewText: 'This cup warmer is a staple of my morning desk routine. It has a micro-gravity pressure switch—it only heats up when you put a cup on it, which is excellent for safety. Keeps tea right at 55°C, warm enough to enjoy without burning your tongue.',
      unboxingText: 'Comes in a cute protective cardboard box. Inside is the glossy black heating coaster with attached USB power wire.',
      setupGuideText: 'Simply plug into any 5V/2A USB port (like a phone adapter or desktop USB hub) and place a flat-bottomed mug on the center circular zone.',
      myExperience: 'I put my ceramic tea mug on it. It stayed steaming hot even after an hour-long Zoom call. Brilliant design!',
      myVerdict: 'A practical, inexpensive, and beautifully designed tech accessory.',
      photos: []
    },
    pros: ['Micro-gravity automatic power on/off', 'Waterproof tempered glass surface', 'Low power 10W design'],
    cons: ['Needs a flat-bottom mug for best heating efficiency', 'USB powered, takes about 10-15 mins to heat cold drinks (best for keeping hot drinks hot)'],
    specifications: [
      { name: 'Constant Temp', value: '55°C / 131°F' },
      { name: 'Power', value: '10 Watts (5V/2A USB)' },
      { name: 'Material', value: 'ABS Plastic + Tempered Glass' }
    ],
    features: ['Pressure Switch Indicator Light', 'Easy wipe cleaning', 'Ultra-thin profile'],
    couponCode: 'WARMCOFFEE',
    alternatives: ['Ember Smart Travel Mug (₹15,000)'],
    frequentlyBoughtTogether: ['prod-1', 'prod-3'],
    faqs: [
      { question: 'Does it work with paper or glass cups?', answer: 'Yes, but flat-bottomed stainless steel, ceramic, or metal mugs provide the absolute best thermal conductivity.' }
    ],
    reelId: 'reel-4',
    status: 'Published',
    createdAt: '2026-06-25T12:00:00Z'
  },
  {
    id: 'prod-6',
    title: 'Multi-Purpose 7-in-1 Tech Cleaning Kit',
    price: 99,
    originalPrice: 299,
    discount: 67,
    description: 'Clean your keyboard, earbuds, monitors, and lens easily. Features a high-density keyboard brush, keycap puller, silicone pen tip, flocking sponge, spray bottle, and thick fiber cloth.',
    whyIRecommend: 'No more dusty keycaps or earwax-covered AirPods. This 7-in-1 kit is incredibly compact, looks like a little Swiss knife, and costs under ₹99. Extremely satisfying to use!',
    brand: 'CleanSet',
    category: 'laptop-accessories',
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1541140111869-aa590cb9b06d?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-close-up-of-hands-cleaning-a-computer-screen-41520-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-clean-kit' },
      { platform: 'Meesho', url: 'https://meesho.com/mock-clean-kit' }
    ],
    badges: {
      seenInReel: false,
      personallyTested: true,
      recommended: true,
      trending: true
    },
    creatorReview: {
      rating: 5,
      reviewText: 'Every gadget nerd needs this! The keycap puller slides right onto mechanical switches, and the deep sweeping brush gets all the pet hair and crumbs out of my keyboard in 2 minutes. The earbud cleaning pen is incredibly clever.',
      unboxingText: 'It is a small cylindrical tube. All tools slide out or clip into the main handle casing.',
      setupGuideText: 'Slide the big brush up to sweep keyboards. Use the small pen tool for phone ports and AirPods grids. Fill the spray bottle with rubbing alcohol to clean screens.',
      myExperience: 'I cleaned my filthy mechanical keyboard and it literally looks brand new. The micro-fiber cloth pad on the back cleans tablet screens in one wipe.',
      myVerdict: 'A simple, highly rewarding product that preserves your expensive electronics.',
      photos: []
    },
    pros: ['Very compact slide design', 'Includes high-density keycap puller', 'Premium flocking sponge'],
    cons: ['Spray bottle is shipped empty (due to liquid shipping rules)'],
    specifications: [
      { name: 'Tools Count', value: '7 Tools' },
      { name: 'Size', value: '12cm x 4.5cm' },
      { name: 'Weight', value: '80 grams' }
    ],
    features: ['Retractable keyboard brush', 'Earphone cleaning pen tip', 'Fiber polishing pad'],
    couponCode: 'CLEANKEY',
    alternatives: ['Premium Keyboard Cleaning Gels (₹499)'],
    frequentlyBoughtTogether: ['prod-3'],
    faqs: [
      { question: 'What liquid should I fill in the spray?', answer: 'We recommend 70% Isopropyl Alcohol or screen-cleaning liquid.' }
    ],
    reelId: undefined,
    status: 'Published',
    createdAt: '2026-06-28T12:00:00Z'
  },
  {
    id: 'prod-7',
    title: 'Aesthetic Sunset Projection Lamp (16 Colors)',
    price: 449,
    originalPrice: 1299,
    discount: 65,
    description: 'Bring the golden hour into your bedroom. This USB-powered sunset lamp projects a gorgeous halo on your walls or ceiling. High-definition crystal lens, metal base, and remote controls with 16 color rings.',
    whyIRecommend: 'This lamp went viral on TikTok and Instagram, and for good reason! The color gradient is unbelievably smooth. Outstanding for photography, vlogging, or ambient cozy nights.',
    brand: 'AuraGlow',
    category: 'home',
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-in-warm-studio-light-41235-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-sunset-lamp' },
      { platform: 'Croma', url: 'https://croma.com/mock-sunset-lamp' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: true,
      trending: true
    },
    creatorReview: {
      rating: 5,
      reviewText: 'I use this to light up the background of my YouTube shorts. It projects a flawless sunset orange or deep cosmic purple halo. Unlike cheap plastic variants, this has a real heavy metal base so it doesn\'t slide off my nightstand.',
      unboxingText: 'Includes the sunset lamp head on a flexible goose-neck stand, stable round base, USB connection line, and a thin IR remote control.',
      setupGuideText: 'Screw the stand into the base, plug the USB cable into a 5V adapter, and point the glass lens at a white wall from 1 to 3 meters away.',
      myExperience: 'The projected circle is vibrant and extremely warm. I love setting it on the slow-fade mode while listening to lo-fi music at night.',
      myVerdict: 'If you want to drastically improve your room aesthetic for under ₹450, this is it.',
      photos: []
    },
    pros: ['Thick, high-transmittance optical crystal lens', 'Flexible 360-degree rotation head', '16 colors with remote controller', 'Heavy metal base for stability'],
    cons: ['Needs a dark room to look truly impressive', 'Remote requires AAA batteries (not included)'],
    specifications: [
      { name: 'Height', value: '25cm' },
      { name: 'Lens Diameter', value: '7cm' },
      { name: 'Power Connection', value: 'USB plug (1.2m wire)' },
      { name: 'Light Source', value: '5W COB LED Chip' }
    ],
    features: ['Color fade, flash, and smooth modes', 'Real optical lens', 'Cold forged aluminum housing'],
    couponCode: 'SUNSETCOZY',
    alternatives: ['Hue Ambient Lightbars (₹6,999)'],
    frequentlyBoughtTogether: ['prod-4', 'prod-12'],
    faqs: [
      { question: 'Does the projected circle get larger?', answer: 'Yes! The further away you place the lamp from the wall, the larger the golden projection becomes.' }
    ],
    reelId: 'reel-5',
    status: 'Published',
    createdAt: '2026-07-02T12:00:00Z'
  },
  {
    id: 'prod-8',
    title: 'Astronaut Nebula & Galaxy Star Projector',
    price: 949,
    originalPrice: 2499,
    discount: 62,
    description: 'Transform any room into a breathtaking cosmic journey. This detailed astronaut figures projects moving green stars and multi-colored nebulae. Magnetic head rotates 360° with timer controls.',
    whyIRecommend: 'This is the crown jewel of desk accessories. The projection looks incredibly rich and fills a massive room ceiling. The astronaut physical figure is a lovely desk companion on its own.',
    brand: 'CosmoToy',
    category: 'gaming',
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-nebula-cluster-in-outer-space-40348-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-astronaut-projector' },
      { platform: 'Flipkart', url: 'https://flipkart.com/mock-astronaut-projector' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: true,
      trending: true
    },
    creatorReview: {
      rating: 5,
      reviewText: 'Absolutely majestic! The laser stars and cloud nebulae can be turned on separately. The astronaut head connects to the body via a strong magnetic ball joint, so you can point the galaxy literally anywhere.',
      unboxingText: 'Inside a beautiful gift-ready box is the Astronaut projection figurine, a lunar surface base plate, a USB power wire, a remote control, and a user manual.',
      setupGuideText: 'Lock the astronaut\'s feet into the lunar stand, connect the USB line to a phone charger, put 2 AAA batteries in the remote, and press power.',
      myExperience: 'It keeps my kids (and honestly, me!) absolutely mesmerized. The auto-off timer (45 or 90 minutes) is perfect for putting it on as a bedtime nightlight.',
      myVerdict: 'A spectacular birthday gift or workspace accessory under ₹1000.',
      photos: []
    },
    pros: ['360-degree rotating head via magnetic joint', 'Dynamic star and nebula speeds', 'Auto sleep timer', 'Detailed physical figurine design'],
    cons: ['Needs a constant USB cable connection (no built-in battery)', 'Green laser star lights are highly focused (avoid looking directly into the lens)'],
    specifications: [
      { name: 'Projection Range', value: '15 to 50 square meters' },
      { name: 'Laser Wave Length', value: '532nm' },
      { name: 'Material', value: 'Premium ABS + PVC' },
      { name: 'Timer Modes', value: '45 mins, 90 mins' }
    ],
    features: ['Removable magnetic helmet', 'Nebula brightness adjust', 'Lunar base detailing'],
    couponCode: 'GALAXY100',
    alternatives: ['Sega Toys Homestar Planetarium (₹18,000)'],
    frequentlyBoughtTogether: ['prod-4', 'prod-7'],
    faqs: [
      { question: 'Is the astronaut head safe to rotate?', answer: 'Yes! It has robust magnetic nodes that let you swirl and aim it freely.' }
    ],
    reelId: 'reel-6',
    status: 'Published',
    createdAt: '2026-07-05T12:00:00Z'
  },
  {
    id: 'prod-9',
    title: 'Professional Milk Frother & Drink Mixer',
    price: 189,
    originalPrice: 499,
    discount: 62,
    description: 'Get rich, creamy cafe-style froth at home in seconds. Ideal for frothing milk for lattes, cappuccinos, mixing protein powders, matcha, or whisking eggs.',
    whyIRecommend: 'Don\'t spend thousands on coffee makers. This ₹189 handheld battery-operated frother creates thick foam inside 15 seconds. Heavy-duty stainless steel wand.',
    brand: 'CafeFlow',
    category: 'kitchen',
    rating: 4.4,
    images: [
      'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-into-coffee-cup-41221-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-milk-frother' },
      { platform: 'Meesho', url: 'https://meesho.com/mock-milk-frother' }
    ],
    badges: {
      seenInReel: false,
      personallyTested: true,
      recommended: false,
      trending: false
    },
    creatorReview: {
      rating: 4,
      reviewText: 'A sturdy little kitchen wand. It spins at a high RPM, making micro-foam in a flash. Great for morning instant coffee or quick protein shakes. Highly durable!',
      unboxingText: 'Comes in a small cardboard sleeve. Batteries are not included (requires 2 AA batteries).',
      setupGuideText: 'Insert 2 AA batteries, submerge the whisking head halfway into warm milk, and hold the top button for 15-20 seconds.',
      myExperience: 'I make cold coffee every single afternoon and this mixer makes it so smooth. Cleaning is as easy as running it under hot soapy water.',
      myVerdict: 'A simple utility that elevates your home coffee game.',
      photos: []
    },
    pros: ['Spins incredibly fast', 'Food-safe 304 stainless steel shaft', 'Lightweight ergonomic handle'],
    cons: ['Needs AA batteries', 'No speed controls (single high speed only)'],
    specifications: [
      { name: 'Material', value: 'Stainless Steel Whisk + ABS body' },
      { name: 'Rotation Speed', value: '19000 RPM' },
      { name: 'Power Source', value: '2 AA Batteries (not included)' }
    ],
    features: ['Comfort grip', 'One-touch operation', 'Corrosion-resistant metal wand'],
    couponCode: 'FROTHCAFE',
    alternatives: ['Ikea Handheld Frother (₹249)'],
    frequentlyBoughtTogether: [],
    faqs: [
      { question: 'Can it whisk heavy egg whites?', answer: 'Yes, but for large batches of cake batter, a larger electric beater is recommended.' }
    ],
    reelId: undefined,
    status: 'Published',
    createdAt: '2026-07-06T12:00:00Z'
  },
  {
    id: 'prod-10',
    title: 'Reusable Double-Sided Heavy Duty Nano Tape',
    price: 99,
    originalPrice: 299,
    discount: 67,
    description: 'This trace-less, double-sided acrylic tape holds up to 1kg on smooth surfaces. Waterproof, highly elastic, and washable—simply rinse dirt off and let it dry to reuse.',
    whyIRecommend: 'No drilling, no nails. I use this tape to stick my extension boxes under my desk, hang frames, and stabilize routers. Every home needs a roll under ₹99!',
    brand: 'NanoStick',
    category: 'home',
    rating: 4.7,
    images: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-close-up-of-double-sided-tape-holding-wood-41952-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-nano-tape' },
      { platform: 'Meesho', url: 'https://meesho.com/mock-nano-tape' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: true,
      trending: false
    },
    creatorReview: {
      rating: 5,
      reviewText: 'This tape has saved me from drilling holes in my rented apartment wall. I have hung 4 heavy power strips, dynamic ambient bars, and a key holder, and none have budged. If you want to take it down, peel it slowly from a corner and it leaves zero residue!',
      unboxingText: 'You get a single heavy-duty clear roll shrink-wrapped in protective plastic.',
      setupGuideText: 'Cut a strip, paste it to your object, peel the red/clear lining film, and press hard on a clean smooth wall.',
      myExperience: 'I washed a small cut-off chunk that got dirty with dust, let it dry, and it became completely sticky again! Absolutely mind-blowing.',
      myVerdict: 'An essential utility tape for renters and desk organizers.',
      photos: []
    },
    pros: ['No residue on removal', 'Washable and reusable', 'Extremely strong holding strength', 'Stretches easily without tearing'],
    cons: ['Not recommended on flaky, painted, or textured drywall (might peel paint)'],
    specifications: [
      { name: 'Length', value: '3 Meters / Roll' },
      { name: 'Thickness', value: '2mm Heavy Duty' },
      { name: 'Material', value: 'Nano PU Gel Acrylic' }
    ],
    features: ['Waterproof adhesion', 'Trace-free peeling', 'High-tensile flexibility'],
    couponCode: 'STICKYTAPE',
    alternatives: ['3M Heavy Mounting Tape (₹350)'],
    frequentlyBoughtTogether: ['prod-1'],
    faqs: [
      { question: 'Will it peel off painted walls?', answer: 'Yes, if the paint layer is old or thin, the extreme grip may lift the paint. Use on tile, metal, glass, or wood instead.' }
    ],
    reelId: 'reel-7',
    status: 'Published',
    createdAt: '2026-07-08T12:00:00Z'
  },
  {
    id: 'prod-11',
    title: 'Sleek Flat felt Desk Mat & Blotter (80 x 40cm)',
    price: 349,
    originalPrice: 899,
    discount: 61,
    description: 'Create a warm, premium office aesthetic with this oversized desk mat. Made of thick, soft eco-felt to protect your desk from coffee spills, scrapes, and keyboard clacks. Supports smooth mouse gliding.',
    whyIRecommend: 'Most felt mats cost upwards of ₹1200. This felt blotter offers excellent desk tracking, cozy comfort under your wrists, and instant minimalist aesthetic for only ₹349.',
    brand: 'NordicDesk',
    category: 'desk-setup',
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-writing-notes-at-a-workdesk-top-view-41223-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-felt-mat' },
      { platform: 'Flipkart', url: 'https://flipkart.com/mock-felt-mat' }
    ],
    badges: {
      seenInReel: true,
      personallyTested: true,
      recommended: true,
      trending: true
    },
    creatorReview: {
      rating: 5,
      reviewText: 'Felt mats are a secret cheat code to making any desk setup look like a high-end designer office. It feels incredibly cozy to work on, especially in air-conditioned rooms. Fits both a mechanical keyboard and mouse with tons of room left over.',
      unboxingText: 'Arrives in a tight cardboard cylinder. Unroll and place some heavy books on the edges for 12 hours to flatten it.',
      setupGuideText: 'Simply roll it out. Place your keyboard and mouse pad directly on the matte surface.',
      myExperience: 'The light-grey felt matches black and wooden desks beautifully. My mouse clicks sound softer and dampens desk vibration.',
      myVerdict: 'Your keyboard and wrists will thank you. Simply beautiful.',
      photos: []
    },
    pros: ['Very elegant grey felt look', 'Large 80x40cm surface coverage', 'Dampens mechanical keyboard sounds', 'Warm and cozy felt texture'],
    cons: ['Felt accumulates cat hair easily (needs lint-rolling)', 'Liquids need to be blotted off immediately to prevent staining'],
    specifications: [
      { name: 'Dimensions', value: '80cm x 40cm (Fits TKL Keyboard & Mouse)' },
      { name: 'Thickness', value: '3mm' },
      { name: 'Material', value: 'Premium Recycled Poly-Felt' }
    ],
    features: ['Anti-fray stitched borders', 'Non-slip rubber backing nodes', 'Highly breathable wool-feel'],
    couponCode: 'FELTMAT',
    alternatives: ['Oaksy Cork Felt Mat (₹1,899)'],
    frequentlyBoughtTogether: ['prod-1', 'prod-3'],
    faqs: [
      { question: 'Is it scratchy on skin?', answer: 'Not at all. The eco-felt is brushed and refined to feel incredibly soft under your forearms.' }
    ],
    reelId: 'reel-8',
    status: 'Published',
    createdAt: '2026-07-10T12:00:00Z'
  },
  {
    id: 'prod-12',
    title: 'Aesthetic Wooden Desk Digital Alarm Clock',
    price: 499,
    originalPrice: 1199,
    discount: 58,
    description: 'A gorgeous block of solid wood that displays time, temperature, and humidity. Senses clap or tap sounds to turn on the screen, and features a wireless aesthetic facade.',
    whyIRecommend: 'Most digital clocks are ugly plastic. This wooden cube matches any plant/oak/wood themed desk perfectly. Senses when you snap your fingers or clap to wake up the screen.',
    brand: 'OakLiving',
    category: 'desk-setup',
    rating: 4.6,
    images: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
    ],
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-analog-clock-ticking-macro-close-up-43125-large.mp4'],
    affiliateLinks: [
      { platform: 'Amazon', url: 'https://amazon.in/dp/mock-wood-clock' },
      { platform: 'Myntra', url: 'https://myntra.com/mock-wood-clock' }
    ],
    badges: {
      seenInReel: false,
      personallyTested: true,
      recommended: true,
      trending: false
    },
    creatorReview: {
      rating: 4,
      reviewText: 'The wood texture looks extremely premium! It blends completely into a natural desk setup when off. The sound sensor is a genius battery-saving feature. You just tap your desk and it lights up beautifully.',
      unboxingText: 'Comes in a brown organic carton. Includes the clock, a USB cable, and a detailed menu for settings.',
      setupGuideText: 'Connect the USB power cable. Use the three buttons on the back to set Year, Date, and Time.',
      myExperience: 'I set it to Sound Control mode. It is off while sleeping, so no annoying lights in my face, but if I snap, it wakes up.',
      myVerdict: 'A classy addition that completes the look of any study table.',
      photos: []
    },
    pros: ['Stunning minimalist wooden brick aesthetic', 'Voice/Clap activation mode', 'Three alarm configurations with snooze', 'Built-in thermometer'],
    cons: ['Needs constant USB power for continuous display (battery mode is strictly sound-controlled to save power)'],
    specifications: [
      { name: 'Material', value: 'Synthetic Medium-Density Fiber wood' },
      { name: 'Display LED Colors', value: 'Soft Warm White' },
      { name: 'Dimensions', value: '15cm x 7cm x 4cm' }
    ],
    features: ['Auto brightness adjust (dimmer at night)', 'Acoustic Control Wakeup', 'Dual power modes'],
    couponCode: 'WOODALARM',
    alternatives: ['Braun Digital Travel Clock (₹3,500)'],
    frequentlyBoughtTogether: ['prod-3', 'prod-11'],
    faqs: [
      { question: 'Can it run on battery only?', answer: 'Yes, but it is highly recommended to keep it plugged in, as batteries will drain fast if the screen is kept continuously on.' }
    ],
    reelId: undefined,
    status: 'Published',
    createdAt: '2026-07-12T12:00:00Z'
  }
];

export const INITIAL_REELS: Reel[] = [
  {
    id: 'reel-1',
    title: 'This ₹99 Magnetic Cable Holder is Pure Magic! 🧲 Desk Setup Upgrades!',
    platform: 'Instagram',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-working-with-various-tools-and-devices-on-desk-43301-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=400&auto=format&fit=crop&q=80',
    category: 'desk-setup',
    productId: 'prod-1',
    likes: 12450,
    shares: 4320
  },
  {
    id: 'reel-2',
    title: 'You need this ₹89 Keychain Emergency COB light! Brightness test! 🔦',
    platform: 'YouTube',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pocket-flashlight-lighting-up-wood-41951-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=400&auto=format&fit=crop&q=80',
    category: 'tech',
    productId: 'prod-2',
    likes: 8320,
    shares: 1950
  },
  {
    id: 'reel-3',
    title: 'Room transformation in 10 seconds! 🤩 Cheap ₹289 RGB lights are wild!',
    platform: 'Instagram',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-gaming-setup-with-colorful-led-lights-42284-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
    category: 'gaming',
    productId: 'prod-4',
    likes: 24500,
    shares: 9400
  },
  {
    id: 'reel-4',
    title: 'Warm coffee forever while writing code ☕ USB Coaster Review ₹199!',
    platform: 'YouTube',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hot-coffee-pouring-into-mug-on-coaster-41220-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=80',
    category: 'desk-setup',
    productId: 'prod-5',
    likes: 7290,
    shares: 3100
  },
  {
    id: 'reel-5',
    title: 'golden hour projection lamp makes my bedroom look insane! 🌅 ₹449 only!',
    platform: 'Instagram',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-in-warm-studio-light-41235-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=400&auto=format&fit=crop&q=80',
    category: 'home',
    productId: 'prod-7',
    likes: 31200,
    shares: 11450
  },
  {
    id: 'reel-6',
    title: 'Unboxing the Astronaut Galaxy Projector! 🌌 Setup looks majestic under ₹999!',
    platform: 'YouTube',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-nebula-cluster-in-outer-space-40348-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    category: 'gaming',
    productId: 'prod-8',
    likes: 19800,
    shares: 7890
  },
  {
    id: 'reel-7',
    title: 'Stop drilling holes in your walls! 🚫 Try this reusable heavy-duty Nano Tape ₹99!',
    platform: 'Instagram',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-double-sided-tape-holding-wood-41952-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
    category: 'home',
    productId: 'prod-10',
    likes: 15400,
    shares: 5120
  },
  {
    id: 'reel-8',
    title: 'Adding a Felt Desk Mat for desk aesthetic upgrades! Soft & Minimalist ₹349!',
    platform: 'YouTube',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-writing-notes-at-a-workdesk-top-view-41223-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
    category: 'desk-setup',
    productId: 'prod-11',
    likes: 9240,
    shares: 2310
  }
];
