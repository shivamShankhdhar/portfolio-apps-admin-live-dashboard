export interface AppFeature {
  label: string;
  value: string;
}

export interface AppItem {
  _id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  category: string;
  package: string;
  version?: string;
  status: string;
  rating?: string;
  ratingCount?: string;
  icon?: string;
  bannerType?: string;
  playStoreUrl?: string;
  privacyUrl?: string;
  technologies?: string[];
  highlights?: string[];
  features?: AppFeature[];
  featured?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultApps: AppItem[] = [
  {
    title: 'Ludo Binge',
    subtitle: 'Classic 4-Player Strategy Board Game',
    tagline: 'Multiplayer Classic Board Gaming with Real-time WebSocket Matchmaking',
    category: 'Games',
    package: 'com.shivam.ludobinge',
    version: 'v1.4.0',
    status: 'Closed Testing',
    rating: 'Coming Soon',
    ratingCount: 'Closed Testing Phase',
    icon: '🎲',
    bannerType: 'ludo',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.shivam.ludobinge',
    privacyUrl: '/privacy-policy/ludo-binge',
    technologies: ['Next.js', 'React Native', 'WebSockets', 'Tailwind CSS', 'Framer Motion'],
    highlights: [
      'Real-time low latency 4-player WebSocket multiplayer engine',
      'Intelligent heuristic AI bot fallback for offline gameplay',
      'Realistic 3D physics dice simulation with custom animated skins',
      'Global leaderboards, player win streaks, and automated room codes',
    ],
    features: [
      { label: 'Multiplayer Engine', value: 'Live 60 FPS WebSockets' },
      { label: 'Testing Status', value: 'Google Play Closed Track' },
      { label: 'Security', value: 'Zero Data Collection & AES Tokens' },
      { label: 'Compatibility', value: 'Android 8.0 & Web Cross-play' },
    ],
    featured: true,
    order: 1,
  },
  {
    title: 'Chess Binge',
    subtitle: 'Grandmaster Tactics & Interactive Engine',
    tagline: 'High Performance Chess Tactics with Local Stockfish AI Engine',
    category: 'Games',
    package: 'com.shivam.chessbinge',
    version: 'v1.1.2',
    status: 'Closed Testing',
    rating: 'Coming Soon',
    ratingCount: 'Internal Review',
    icon: '♟️',
    bannerType: 'chess',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.shivam.chessbinge',
    privacyUrl: '/privacy-policy/chess-binge',
    technologies: ['React Native', 'Stockfish Engine', 'TypeScript', 'WebAssembly'],
    highlights: [
      'Integrated Stockfish 16 analysis engine with configurable depth (1-20)',
      '1,000+ tactical puzzles with progressive ELO rating matching',
      'FIDE standard timer clocks (Blitz, Rapid, Bullet, Custom increments)',
      'Full PGN export and move-by-move evaluation review graphs',
    ],
    features: [
      { label: 'AI Engine', value: 'Stockfish 16 WASM Depth 20' },
      { label: 'Game Modes', value: 'Pass & Play, Stockfish AI, Clock Timer' },
      { label: 'Rules Standard', value: 'FIDE Compliant En Passant & Castling' },
      { label: 'Privacy', value: '100% Offline Capable & Ad-Free' },
    ],
    featured: true,
    order: 2,
  },
  {
    title: 'FlowTask',
    subtitle: 'Minimalist Focus & Kanban Workflow',
    tagline: 'Developer Task Manager with Offline SQLite Encryption & Pomodoro Clocks',
    category: 'Apps',
    package: 'com.shivam.flowtask',
    version: 'v2.1.0',
    status: 'Google Play Production',
    rating: '4.9',
    ratingCount: '10K+ Downloads',
    icon: '⚡',
    bannerType: 'default',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.shivam.flowtask',
    privacyUrl: '/privacy-policy/flow-task',
    technologies: ['React Native', 'SQLite', 'TypeScript', 'Tailwind CSS'],
    highlights: [
      'Local-first encrypted SQLite database with instant zero-lag responsiveness',
      'Customizable Pomodoro timer with ambient background focus audio',
      'Interactive Kanban boards with drag-and-drop state transitions',
      'Markdown task descriptions, subtasks, checklists, and code snippets',
    ],
    features: [
      { label: 'Storage', value: 'Offline-First Encrypted SQLite' },
      { label: 'Production Status', value: 'Live on Google Play Store' },
      { label: 'Cloud Sync', value: 'Optional End-to-End Encrypted Backup' },
      { label: 'Theme Engine', value: 'Crimson Dark & OLED Black' },
    ],
    featured: true,
    order: 3,
  },
  {
    title: 'DevLens',
    subtitle: 'System Monitor & API Debugger',
    tagline: 'Network Packet Sniffer & Hardware Performance Telemetry for Mobile Engineers',
    category: 'Apps',
    package: 'com.shivam.devlens',
    version: 'v1.0.5',
    status: 'Google Play Production',
    rating: '4.8',
    ratingCount: '5K+ Developers',
    icon: '🔍',
    bannerType: 'default',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.shivam.devlens',
    privacyUrl: '/privacy-policy/dev-lens',
    technologies: ['React Native', 'Kotlin', 'Network Telemetry', 'Reanimated'],
    highlights: [
      'Real-time HTTP/HTTPS traffic inspector with header & payload parsing',
      'Live CPU, GPU, Memory, and Battery thermal profiling graphs at 60 FPS',
      'Floating overlay widget for in-app testing without leaving target app',
      'cURL export command generator with single-tap clipboard copy',
    ],
    features: [
      { label: 'Inspection Level', value: 'HTTP/HTTPS Network & WebSocket Tracing' },
      { label: 'Telemetry', value: '60 FPS Hardware Sensors & Thermal Metrics' },
      { label: 'Production Status', value: 'Live on Google Play Store' },
      { label: 'Security', value: 'Sandbox Monitored, No Root Required' },
    ],
    featured: true,
    order: 4,
  },
];
