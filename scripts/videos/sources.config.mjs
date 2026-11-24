// Query plan for scripts/videos/collect.mjs.
//
// Categories MUST be values of VideoCategoryEnum in src/lib/db/schema/videos.ts:
//   BUSINESS FINANCE TECH EDUCATION ENTERTAINMENT LIFESTYLE GAMING SPORTS MUSIC NEWS TUTORIAL
// Mapping used here: space / earth / nature / science -> EDUCATION, engineering &
// spaceflight hardware -> TECH, food / cities / travel -> LIFESTYLE, cooking
// how-tos -> TUTORIAL, sport -> SPORTS, light-hearted animal & spectacle clips ->
// ENTERTAINMENT.
//
// `take` = how many accepted clips to keep from this query (best-scored first).

export const NASA_QUERIES = [
  { q: 'ISS earth timelapse', category: 'EDUCATION', tags: ['space', 'earth', 'timelapse'], take: 3 },
  { q: 'earth views from space station', category: 'EDUCATION', tags: ['space', 'earth'], take: 2 },
  { q: 'launch b-roll', category: 'TECH', tags: ['space', 'rocket', 'launch'], take: 3 },
  { q: 'Artemis I launch', category: 'TECH', tags: ['space', 'rocket', 'artemis'], take: 2 },
  { q: 'rocket engine test', category: 'TECH', tags: ['rocket', 'engineering'], take: 2 },
  { q: 'Perseverance rover', category: 'TECH', tags: ['mars', 'rover', 'space'], take: 2 },
  { q: 'Ingenuity helicopter', category: 'TECH', tags: ['mars', 'helicopter', 'space'], take: 1 },
  { q: 'solar flare', category: 'EDUCATION', tags: ['sun', 'space'], take: 2 },
  { q: 'black hole', category: 'EDUCATION', tags: ['space', 'astronomy'], take: 1 },
  { q: 'Hubble zoom', category: 'EDUCATION', tags: ['space', 'astronomy', 'hubble'], take: 2 },
  { q: 'Webb telescope', category: 'EDUCATION', tags: ['space', 'astronomy', 'webb'], take: 1 },
  { q: 'moon', category: 'EDUCATION', tags: ['moon', 'space'], take: 2 },
  { q: 'spacewalk', category: 'TECH', tags: ['space', 'astronaut'], take: 2 },
  { q: 'aircraft flight', category: 'TECH', tags: ['aviation', 'aircraft'], take: 2 },
  { q: 'scientific balloon', category: 'TECH', tags: ['balloon', 'science'], take: 1 },
  { q: 'parachute test', category: 'TECH', tags: ['engineering', 'parachute'], take: 1 },
  { q: 'hurricane from space', category: 'EDUCATION', tags: ['weather', 'earth', 'hurricane'], take: 2 },
  { q: 'aurora', category: 'EDUCATION', tags: ['aurora', 'earth', 'space weather'], take: 1 },
  { q: 'comet', category: 'EDUCATION', tags: ['space', 'astronomy', 'comet'], take: 1 },
  { q: 'robot', category: 'TECH', tags: ['robotics', 'technology'], take: 1 },
  { q: 'Jupiter', category: 'EDUCATION', tags: ['space', 'planets', 'jupiter'], take: 1 },
  { q: 'Saturn', category: 'EDUCATION', tags: ['space', 'planets', 'saturn'], take: 1 },
];

export const SVS_QUERIES = [
  { q: 'perpetual ocean', category: 'EDUCATION', tags: ['ocean', 'currents', 'earth'], take: 1 },
  { q: 'sea surface temperature', category: 'EDUCATION', tags: ['ocean', 'climate', 'earth'], take: 1 },
  { q: 'hurricane', category: 'EDUCATION', tags: ['weather', 'hurricane', 'earth'], take: 2 },
  { q: 'aerosols', category: 'EDUCATION', tags: ['atmosphere', 'earth'], take: 1 },
  { q: 'sea ice', category: 'EDUCATION', tags: ['arctic', 'ice', 'climate'], take: 1 },
  { q: 'moon phase and libration', category: 'EDUCATION', tags: ['moon', 'space'], take: 1 },
  { q: 'solar dynamics observatory', category: 'EDUCATION', tags: ['sun', 'space'], take: 1 },
  { q: 'carbon dioxide', category: 'EDUCATION', tags: ['climate', 'atmosphere'], take: 1 },
  { q: 'clouds', category: 'EDUCATION', tags: ['weather', 'clouds', 'earth'], take: 1 },
  { q: 'fires', category: 'EDUCATION', tags: ['fires', 'earth'], take: 1 },
  { q: 'precipitation', category: 'EDUCATION', tags: ['rain', 'weather'], take: 1 },
  { q: 'Greenland ice', category: 'EDUCATION', tags: ['ice', 'climate'], take: 1 },
  { q: 'eclipse', category: 'EDUCATION', tags: ['eclipse', 'space'], take: 1 },
  { q: 'black hole', category: 'EDUCATION', tags: ['space', 'astronomy'], take: 1 },
  { q: 'galaxy', category: 'EDUCATION', tags: ['space', 'astronomy'], take: 1 },
];

// Commons: CirrusSearch terms (filetype:video is added automatically).
export const COMMONS_QUERIES = [
  // Animals & nature
  { q: 'cat playing', category: 'ENTERTAINMENT', tags: ['cats', 'animals', 'pets'], take: 2 },
  { q: 'dog playing', category: 'ENTERTAINMENT', tags: ['dogs', 'animals', 'pets'], take: 2 },
  { q: 'kitten', category: 'ENTERTAINMENT', tags: ['cats', 'animals', 'pets'], take: 1 },
  { q: 'puppy', category: 'ENTERTAINMENT', tags: ['dogs', 'animals', 'pets'], take: 1 },
  { q: 'gorilla', category: 'EDUCATION', tags: ['gorillas', 'wildlife', 'africa'], take: 2 },
  { q: 'elephant', category: 'EDUCATION', tags: ['elephants', 'wildlife'], take: 2 },
  { q: 'giraffe', category: 'EDUCATION', tags: ['giraffes', 'wildlife'], take: 1 },
  { q: 'zebra', category: 'EDUCATION', tags: ['zebras', 'wildlife'], take: 1 },
  { q: 'lion', category: 'EDUCATION', tags: ['lions', 'wildlife'], take: 1 },
  { q: 'hummingbird', category: 'EDUCATION', tags: ['birds', 'wildlife'], take: 1 },
  { q: 'bee flower', category: 'EDUCATION', tags: ['bees', 'insects', 'flowers'], take: 1 },
  { q: 'butterfly', category: 'EDUCATION', tags: ['butterflies', 'insects'], take: 1 },
  { q: 'owl', category: 'EDUCATION', tags: ['birds', 'owls'], take: 1 },
  { q: 'penguin', category: 'ENTERTAINMENT', tags: ['penguins', 'birds'], take: 1 },
  { q: 'flamingo', category: 'EDUCATION', tags: ['birds', 'flamingos'], take: 1 },
  { q: 'horse running', category: 'EDUCATION', tags: ['horses', 'animals'], take: 1 },
  { q: 'squirrel', category: 'ENTERTAINMENT', tags: ['squirrels', 'animals'], take: 1 },
  { q: 'otter', category: 'ENTERTAINMENT', tags: ['otters', 'animals'], take: 1 },
  { q: 'panda', category: 'ENTERTAINMENT', tags: ['pandas', 'animals'], take: 1 },
  { q: 'chameleon', category: 'EDUCATION', tags: ['reptiles', 'animals'], take: 1 },
  { q: 'frog', category: 'EDUCATION', tags: ['frogs', 'animals'], take: 1 },
  { q: 'monkey', category: 'ENTERTAINMENT', tags: ['monkeys', 'animals'], take: 1 },
  // Oceans & water
  { q: 'jellyfish', category: 'EDUCATION', tags: ['ocean', 'jellyfish', 'marine life'], take: 1 },
  { q: 'octopus', category: 'EDUCATION', tags: ['ocean', 'octopus', 'marine life'], take: 1 },
  { q: 'coral reef', category: 'EDUCATION', tags: ['ocean', 'coral', 'marine life'], take: 2 },
  { q: 'sea turtle', category: 'EDUCATION', tags: ['ocean', 'turtles', 'marine life'], take: 1 },
  { q: 'dolphins', category: 'EDUCATION', tags: ['ocean', 'dolphins', 'marine life'], take: 1 },
  { q: 'whale', category: 'EDUCATION', tags: ['ocean', 'whales', 'marine life'], take: 1 },
  { q: 'NOAA fish', category: 'EDUCATION', tags: ['ocean', 'fish', 'marine life'], take: 1 },
  { q: 'ocean waves', category: 'EDUCATION', tags: ['ocean', 'waves'], take: 2 },
  { q: 'waterfall', category: 'EDUCATION', tags: ['waterfalls', 'nature'], take: 2 },
  // Earth & weather
  { q: 'volcano lava', category: 'EDUCATION', tags: ['volcanoes', 'lava', 'earth'], take: 2 },
  { q: 'geyser', category: 'EDUCATION', tags: ['geysers', 'earth'], take: 1 },
  { q: 'lightning', category: 'EDUCATION', tags: ['weather', 'lightning', 'storms'], take: 1 },
  { q: 'clouds timelapse', category: 'EDUCATION', tags: ['weather', 'clouds', 'timelapse'], take: 1 },
  { q: 'snow falling', category: 'EDUCATION', tags: ['weather', 'snow'], take: 1 },
  { q: 'sunset timelapse', category: 'ENTERTAINMENT', tags: ['sunset', 'timelapse'], take: 1 },
  { q: 'flower blooming timelapse', category: 'EDUCATION', tags: ['flowers', 'plants', 'timelapse'], take: 1 },
  // Cities & travel
  { q: 'Kigali', category: 'LIFESTYLE', tags: ['rwanda', 'kigali', 'travel', 'africa'], take: 2 },
  { q: 'Rwanda', category: 'LIFESTYLE', tags: ['rwanda', 'travel', 'africa'], take: 2 },
  { q: 'city timelapse', category: 'LIFESTYLE', tags: ['cities', 'timelapse', 'travel'], take: 2 },
  { q: 'tram', category: 'LIFESTYLE', tags: ['cities', 'transport', 'travel'], take: 1 },
  { q: 'train passing', category: 'LIFESTYLE', tags: ['trains', 'transport'], take: 1 },
  { q: 'Venice', category: 'LIFESTYLE', tags: ['venice', 'italy', 'travel'], take: 1 },
  { q: 'Eiffel Tower', category: 'LIFESTYLE', tags: ['paris', 'france', 'travel'], take: 1 },
  { q: 'drone aerial', category: 'LIFESTYLE', tags: ['aerial', 'drone', 'travel'], take: 2 },
  { q: 'hot air balloon', category: 'ENTERTAINMENT', tags: ['balloons', 'travel'], take: 1 },
  { q: 'fireworks', category: 'ENTERTAINMENT', tags: ['fireworks', 'celebration'], take: 1 },
  { q: 'ferris wheel', category: 'ENTERTAINMENT', tags: ['amusement', 'cities'], take: 1 },
  // Food
  { q: 'cooking', category: 'LIFESTYLE', tags: ['food', 'cooking'], take: 2 },
  { q: 'baking bread', category: 'TUTORIAL', tags: ['food', 'baking', 'bread'], take: 1 },
  { q: 'pizza', category: 'LIFESTYLE', tags: ['food', 'pizza'], take: 1 },
  { q: 'coffee', category: 'LIFESTYLE', tags: ['coffee', 'drinks'], take: 1 },
  { q: 'tea preparation', category: 'LIFESTYLE', tags: ['tea', 'drinks'], take: 1 },
  { q: 'pancakes', category: 'TUTORIAL', tags: ['food', 'cooking'], take: 1 },
  { q: 'fruit market', category: 'LIFESTYLE', tags: ['food', 'markets', 'fruit'], take: 1 },
  { q: 'grill barbecue', category: 'LIFESTYLE', tags: ['food', 'barbecue'], take: 1 },
  { q: 'chocolate', category: 'LIFESTYLE', tags: ['food', 'chocolate'], take: 1 },
  // Sports
  { q: 'surfing', category: 'SPORTS', tags: ['surfing', 'ocean', 'sports'], take: 2 },
  { q: 'skateboarding', category: 'SPORTS', tags: ['skateboarding', 'sports'], take: 1 },
  { q: 'football match', category: 'SPORTS', tags: ['football', 'soccer', 'sports'], take: 1 },
  { q: 'basketball', category: 'SPORTS', tags: ['basketball', 'sports'], take: 1 },
  { q: 'cycling race', category: 'SPORTS', tags: ['cycling', 'sports'], take: 1 },
  { q: 'skiing', category: 'SPORTS', tags: ['skiing', 'winter sports'], take: 1 },
  { q: 'rowing', category: 'SPORTS', tags: ['rowing', 'water sports'], take: 1 },
  { q: 'climbing', category: 'SPORTS', tags: ['climbing', 'sports'], take: 1 },
  { q: 'kitesurfing', category: 'SPORTS', tags: ['kitesurfing', 'water sports'], take: 1 },
  { q: 'paragliding', category: 'SPORTS', tags: ['paragliding', 'air sports'], take: 1 },
  { q: 'marathon', category: 'SPORTS', tags: ['running', 'sports'], take: 1 },
  // Science, technology & crafts
  { q: '3D printer', category: 'TECH', tags: ['3d printing', 'technology'], take: 1 },
  { q: 'robot arm', category: 'TECH', tags: ['robotics', 'technology'], take: 1 },
  { q: 'chemical reaction', category: 'EDUCATION', tags: ['chemistry', 'science'], take: 1 },
  { q: 'ferrofluid', category: 'EDUCATION', tags: ['physics', 'science', 'magnets'], take: 1 },
  { q: 'wind turbine', category: 'TECH', tags: ['energy', 'wind power'], take: 1 },
  { q: 'steam locomotive', category: 'TECH', tags: ['trains', 'engineering', 'history'], take: 1 },
  { q: 'airplane landing', category: 'TECH', tags: ['aviation', 'airplanes'], take: 1 },
  { q: 'glass blowing', category: 'LIFESTYLE', tags: ['crafts', 'glass'], take: 1 },
  { q: 'pottery wheel', category: 'LIFESTYLE', tags: ['crafts', 'pottery'], take: 1 },
  { q: 'blacksmith', category: 'LIFESTYLE', tags: ['crafts', 'metalwork'], take: 1 },
  { q: 'slow motion water drop', category: 'EDUCATION', tags: ['physics', 'slow motion'], take: 1 },
  { q: 'telescope night sky timelapse', category: 'EDUCATION', tags: ['astronomy', 'night sky', 'timelapse'], take: 1 },
];

// Words that disqualify a candidate (checked against title, description,
// keywords and Commons categories, case-insensitive, whole words; a trailing *
// means prefix match, e.g. 'politic*' matches 'politics' and 'political').
export const BLOCK_WORDS = [
  // politics / conflict / religion / sensitive
  'politic*', 'election', 'president', 'senator', 'congress', 'minister', 'parliament', 'campaign',
  'protest', 'demonstration', 'riot', 'police', 'military', 'army', 'soldier', 'war', 'weapon',
  'gun', 'shooting', 'missile', 'bomb', 'explosion', 'attack', 'terror', 'genocide', 'memorial',
  'funeral', 'church', 'mosque', 'temple', 'religio*', 'prayer', 'pray', 'mass', 'jesus', 'islam',
  'christian', 'hindu', 'buddhis*', 'ritual', 'sacrifice', 'slaughter', 'hunting', 'blood', 'dead',
  'death', 'killed', 'accident', 'crash', 'injur*', 'surgery', 'disease', 'parasite', 'patient',
  'hospital', 'birth', 'breeding', 'mating', 'nude', 'naked', 'sex', 'fight', 'catfight', 'cruelty',
  'covid', 'pandemic', 'refugee', 'prison', 'drunk', 'alcohol', 'beer', 'wine', 'cigarette', 'smoking',
  'casino', 'gambling', 'lottery',
  // talking heads / non-visual / formats we don't want
  'interview', 'briefing', 'news conference', 'press conference', 'panel', 'webinar', 'lecture',
  'talk', 'q&a', 'town hall', 'ceremony', 'award', 'remarks', 'speech', 'podcast', 'livestream',
  'live stream', 'science live', 'nasa science live', 'testimony', 'hearing', 'asl', 'sign language',
  'trailer', 'teaser', 'advert*', 'commercial', 'promo', 'sponsor', 'unboxing', 'review',
  'audio description', 'described', 'captioned', 'spanish', 'español', 'en español', 'french version',
  'slideshow', 'powerpoint', 'screencast', 'tutorial video of software', 'wikipedia',
  'wikimania', 'wikimedia', 'edit-a-thon', 'hackathon', 'conference', 'meetup', 'vlog',
  // brands / companies
  'spacex', 'boeing', 'blue origin', 'lockheed', 'northrop', 'coca', 'pepsi', 'nike',
  'adidas', 'mcdonald*', 'starbucks', 'red bull', 'tesla', 'google', 'microsoft', 'samsung',
  // copyright / restriction markers
  'copyright', '©', 'all rights reserved', 'courtesy of', 'used with permission',
];
