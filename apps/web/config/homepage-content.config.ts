type IconType = 'presentation' | 'chart' | 'sparkles' | 'book';
type BlogType = 'Guide' | 'Tutorial';
type IconName =
  | 'Brain'
  | 'Presentation'
  | 'BookOpen'
  | 'LayoutDashboard'
  | 'Sparkles'
  | 'BarChart3';

interface BlogPost {
  title: string;
  description: string;
  iconType: IconType;
  blogType: BlogType;
  readTimeMinutes: number;
}

interface StickyContentItem {
  title: string;
  description: string[];
  imageSrc: string;
}

interface FeatureCard {
  title: string;
  description: string;
  iconName: IconName;
}

const featureCards: FeatureCard[] = [
  {
    title: 'Fine-tuned AI',
    description:
      'AI tailored to the task of creating high-quality presentation content.',
    iconName: 'Brain',
  },
  {
    title: 'Proven Methodology',
    description: 'AI is automating a proven presentation development approach.',
    iconName: 'Presentation',
  },
  {
    title: 'Instant Access',
    description:
      'Online video lessons available 24/7 for maximum convenience. Self-paced lessons provide complete flexibility.',
    iconName: 'BookOpen',
  },
  {
    title: 'Certification',
    description:
      'Earn presentation excellence Certification. Share achievements on LinkedIn.',
    iconName: 'LayoutDashboard',
  },
  {
    title: 'Private Coaching',
    description:
      'Our one-on-one coaching delivers high touch, custom feedback and support.',
    iconName: 'Sparkles',
  },
  {
    title: '•	30-Day Money-Back Guarantee',
    description:
      'Cancel anytime in your first 30 days and receive a full refund.',
    iconName: 'BarChart3',
  },
];

export const homepageContentConfig = {
  hero: {
    title: 'Write more impactful presentations ',
    subtitle:
      'AI-powered writing canvas, video training, private coaching for high-stakes consulting, sales & investor presentations',
  },
  sticky: {
    title: 'Everything you need to create winning presentations',
    subtitle: 'Comprehensive tools and training to elevate your presentation skills',
    content: [
      {
        title: 'AI-Powered writing canvas',
        description: [
          'AI writing canvas that helps you think faster',
          'Fine-tuned, task-specific AI for corporate, consulting and sales professionals',
          'Automates use of proven, structured methodologies favoured by McKinsey, Google and top investment banks (SCQ, MECE, abstractions)',
        ],
        imageSrc: '/images/video-hero-preview.avif',
      },
      {
        title: "Web's premium online training program",
        description: [
          'Learn proven techniques to convince C-Suite executives',
          'Expert training for high-stakes meetings that goes beyond public speaking, leveraging logical structure, story, data visualization, and the fundamentals of design.',
          'Develop compelling business cases',
          'Practice with real-world examples and case studies',
        ],
        imageSrc: '/images/course-chapters.webp',
      },
      {
        title: 'One-to-One Coaching',
        description: [
          'Get personalized feedback on your presentations',
          'Build confidence through expert guidance',
          'Learn advanced presentation techniques',
          'Prepare for high-stakes meetings and pitches',
        ],
        imageSrc: '/images/team-life.webp',
      },
    ] as StickyContentItem[],
  },
  features: {
    title: 'How we are different',
    subtitle: 'Unique features that set us apart from traditional presentation tools',
    cards: featureCards,
  },
  testimonials: {
    title: 'What our Users Say',
    subtitle: 'Success stories from professionals who transformed their presentation skills',
  },
  essentialReads: {
    title: 'Go Deeper, Learn Faster with these Essential Reads',
    subtitle: 'Expert insights and practical guides to master presentation excellence',
    posts: [
      {
        title: 'Advanced Guide to McKinsey-style Business Presentations',
        description:
          'The ultimate guide to writing clear concise, and convincing business presentations. Our 10,000 word manifesto.',
        iconType: 'presentation' as IconType,
        blogType: 'Guide' as BlogType,
        readTimeMinutes: 15,
      },
      {
        title: 'Pitch Decks & Funding Proposals',
        description:
          "The consensus view from the world's leading venture capitalists on what you need in your funding pitch.",
        iconType: 'chart' as IconType,
        blogType: 'Tutorial' as BlogType,
        readTimeMinutes: 12,
      },
      {
        title: 'Presentation Teardown: BCG Presentation Review',
        description:
          "A 'teardown' of a presentation from Boston Consulting Group, exploring what it does well and finding areas where there is room for improvement.",
        iconType: 'sparkles' as IconType,
        blogType: 'Guide' as BlogType,
        readTimeMinutes: 18,
      },
    ] as BlogPost[],
  },
  pricing: {
    title: 'Fair pricing for all types of businesses',
    subtitle: 'Get started on our free plan and upgrade when you are ready',
    pill: 'Get started for free. No credit card required.',
  },
};
