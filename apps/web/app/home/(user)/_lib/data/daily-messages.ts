import type { DailyMessage } from "../types/daily-message.types";

/**
 * Date-specific daily messages keyed by "MM-DD".
 * Entries with a `locales` array are shown only to users in those countries.
 * Entries without `locales` are universal.
 */
export const DAILY_MESSAGES: Record<string, DailyMessage[]> = {
	// ── January ──────────────────────────────────────────────────────────
	"01-01": [
		{
			text: "Happy New Year! Here's to fresh starts",
			emoji: "🎉",
			category: "holiday",
		},
	],
	"01-02": [
		{
			text: "If you rip a hole in a net, it actually has fewer holes than before",
			emoji: "🤯",
			category: "shower-thought",
		},
	],
	"01-03": [
		{
			text: "J.R.R. Tolkien was born today — one does not simply ignore that",
			emoji: "🧙",
			category: "pop-culture",
		},
	],
	"01-04": [
		{
			text: "It's National Trivia Day — time to flex those fun facts",
			emoji: "🧠",
			category: "national-day",
		},
	],
	"01-05": [
		{
			text: "Twelfth Night marks the end of the Christmas season",
			emoji: "🎭",
			category: "seasonal",
			locales: ["GB", "IE"],
		},
		{
			text: "Your future self is watching you right now through memories",
			emoji: "🔮",
			category: "shower-thought",
		},
	],
	"01-06": [
		{
			text: "Epiphany is celebrated today in many countries around the world",
			emoji: "⭐",
			category: "holiday",
		},
	],
	"01-07": [
		{
			text: "Every book ever written is just a remix of the same 26 letters",
			emoji: "📚",
			category: "shower-thought",
		},
	],
	"01-08": [
		{
			text: "Elvis was born today — thank you, thank you very much",
			emoji: "🎸",
			category: "pop-culture",
		},
	],
	"01-09": [
		{
			text: "The first iPhone was announced on this day in 2007 — it didn't even have copy-paste",
			emoji: "📱",
			category: "history",
		},
	],
	"01-10": [
		{
			text: "The London Underground opened today in 1863 — the world's first subway",
			emoji: "🚇",
			category: "history",
			locales: ["GB"],
		},
		{
			text: "It's Houseplant Appreciation Day — give your green friends some love",
			emoji: "🪴",
			category: "national-day",
		},
	],
	"01-13": [
		{
			text: "It's National Sticker Day — peel, stick, repeat",
			emoji: "✨",
			category: "national-day",
		},
	],
	"01-14": [
		{
			text: "The Simpsons first aired today in 1990 — D'oh!",
			emoji: "📺",
			category: "pop-culture",
		},
	],
	"01-15": [
		{
			text: "Martin Luther King Jr. was born on this day in 1929",
			emoji: "✊",
			category: "history",
			locales: ["US"],
		},
		{
			text: "Wikipedia launched on this day in 2001 — goodbye, encyclopedias",
			emoji: "📚",
			category: "history",
		},
	],
	"01-17": [
		{
			text: "Woolly mammoths were still alive when the Great Pyramid was being built",
			emoji: "🦣",
			category: "plot-twist",
		},
	],
	"01-18": [
		{
			text: "It's National Thesaurus Day — or should we say, lexicon celebration day",
			emoji: "📖",
			category: "national-day",
		},
	],
	"01-20": [
		{
			text: "It's Penguin Awareness Day — waddle you do to celebrate?",
			emoji: "🐧",
			category: "national-day",
		},
	],
	"01-22": [
		{
			text: "The first episode of Friends aired... wait, no — that's in September",
			emoji: "😄",
			category: "pop-culture",
		},
	],
	"01-24": [
		{
			text: "Your stomach thinks all potatoes are mashed",
			emoji: "🥔",
			category: "shower-thought",
		},
	],
	"01-25": [
		{
			text: "Burns Night — raise a glass to Scotland's favourite poet",
			emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
			category: "holiday",
			locales: ["GB"],
		},
		{ text: "Opposite Day — or is it?", emoji: "🔄", category: "national-day" },
	],
	"01-26": [
		{
			text: "Happy Australia Day!",
			emoji: "🇦🇺",
			category: "holiday",
			locales: ["AU"],
		},
		{
			text: "Nothing is on fire — fire is on things",
			emoji: "🔥",
			category: "shower-thought",
		},
	],
	"01-27": [
		{
			text: "The lighter was invented before the match. Let that sink in",
			emoji: "🔥",
			category: "plot-twist",
		},
	],
	"01-28": [
		{
			text: "LEGO was patented on this day in 1958 — everything is awesome",
			emoji: "🧱",
			category: "history",
		},
	],
	"01-29": [
		{
			text: "It's National Puzzle Day — piece together something great today",
			emoji: "🧩",
			category: "national-day",
		},
	],
	"01-30": [
		{
			text: "Humans share about 60% of their DNA with bananas",
			emoji: "🍌",
			category: "plot-twist",
		},
	],
	"01-31": [
		{
			text: "It's Inspire Your Heart with Art Day",
			emoji: "🎨",
			category: "national-day",
		},
	],

	// ── February ─────────────────────────────────────────────────────────
	"02-01": [
		{
			text: "It's the start of Black History Month",
			emoji: "✊",
			category: "seasonal",
			locales: ["US", "CA"],
		},
		{
			text: "It's the start of LGBT History Month",
			emoji: "🏳️‍🌈",
			category: "seasonal",
			locales: ["GB"],
		},
	],
	"02-02": [
		{
			text: "Groundhog Day — did they see their shadow?",
			emoji: "🐿️",
			category: "national-day",
			locales: ["US", "CA"],
		},
		{
			text: "The word 'bed' actually looks like a bed",
			emoji: "🛏️",
			category: "shower-thought",
		},
	],
	"02-04": [
		{
			text: "Facebook launched on this day in 2004 — your parents arrived about 10 years later",
			emoji: "👍",
			category: "history",
		},
	],
	"02-05": [
		{
			text: "France was still using the guillotine when Star Wars first hit cinemas",
			emoji: "⚔️",
			category: "plot-twist",
		},
	],
	"02-06": [
		{
			text: "Waitangi Day — New Zealand's national day",
			emoji: "🇳🇿",
			category: "holiday",
		},
	],
	"02-07": [
		{
			text: "Every pizza is a personal pizza if you believe in yourself",
			emoji: "🍕",
			category: "shower-thought",
		},
	],
	"02-09": [
		{
			text: "It's National Pizza Day — the most universally loved food",
			emoji: "🍕",
			category: "national-day",
		},
	],
	"02-11": [
		{
			text: "Nintendo was founded in 1889 — during the Ottoman Empire",
			emoji: "🎮",
			category: "plot-twist",
		},
	],
	"02-12": [
		{
			text: "Abraham Lincoln and Charles Darwin were both born on this day in 1809 — same day, same year",
			emoji: "🎩",
			category: "history",
		},
	],
	"02-13": [
		{
			text: "It's World Radio Day — tune in to something unexpected",
			emoji: "📻",
			category: "national-day",
		},
	],
	"02-14": [
		{ text: "Happy Valentine's Day", emoji: "💕", category: "holiday" },
	],
	"02-17": [
		{
			text: "It's Random Acts of Kindness Day",
			emoji: "💛",
			category: "national-day",
		},
	],
	"02-20": [
		{
			text: "It's Love Your Pet Day — give them an extra treat",
			emoji: "🐾",
			category: "national-day",
		},
	],
	"02-22": [
		{ text: "It's World Thinking Day", emoji: "💭", category: "national-day" },
	],
	"02-25": [
		{
			text: "You've never actually seen your own face — only reflections and photos of it",
			emoji: "🪞",
			category: "shower-thought",
		},
	],
	"02-29": [
		{
			text: "Happy Leap Day! This only happens once every four years",
			emoji: "🐸",
			category: "seasonal",
		},
	],

	// ── March ────────────────────────────────────────────────────────────
	"03-01": [
		{
			text: "Happy St. David's Day — the patron saint of Wales",
			emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
			category: "holiday",
			locales: ["GB"],
		},
		{
			text: "It's the start of Women's History Month",
			emoji: "👩",
			category: "seasonal",
		},
	],
	"03-03": [
		{
			text: "It's World Wildlife Day — celebrating the animal kingdom",
			emoji: "🦁",
			category: "national-day",
		},
	],
	"03-04": [
		{
			text: "You're not stuck in traffic — you are the traffic",
			emoji: "🚗",
			category: "shower-thought",
		},
	],
	"03-06": [
		{
			text: "The fax machine was invented the same year as the Oregon Trail migration (1843)",
			emoji: "📠",
			category: "plot-twist",
		},
	],
	"03-08": [
		{
			text: "Happy International Women's Day",
			emoji: "💜",
			category: "holiday",
		},
	],
	"03-10": [
		{
			text: "Chuck Norris was born today — the calendar skipped from March 9th straight to the 11th, but Chuck roundhouse-kicked it back",
			emoji: "🥋",
			category: "pop-culture",
		},
	],
	"03-12": [
		{
			text: "The World Wide Web was invented on this day in 1989 — and the first website was incredibly boring",
			emoji: "🌐",
			category: "history",
		},
	],
	"03-14": [
		{
			text: "Happy Pi Day! 3.14159265358979...",
			emoji: "🥧",
			category: "national-day",
		},
	],
	"03-16": [
		{
			text: "Your alarm clock is arguably the rudest thing you own",
			emoji: "⏰",
			category: "shower-thought",
		},
	],
	"03-17": [
		{
			text: "Happy St. Patrick's Day!",
			emoji: "☘️",
			category: "holiday",
			locales: ["IE", "US"],
		},
		{
			text: "St. Patrick's Day — Lá Fhéile Pádraig sona duit!",
			emoji: "☘️",
			category: "holiday",
		},
	],
	"03-20": [
		{
			text: "Happy first day of spring! Fresh starts all around",
			emoji: "🌱",
			category: "seasonal",
		},
	],
	"03-21": [
		{
			text: "It's World Poetry Day — roses are red, your work is great",
			emoji: "📝",
			category: "national-day",
		},
	],
	"03-22": [
		{
			text: "It's World Water Day — stay hydrated",
			emoji: "💧",
			category: "national-day",
		},
	],
	"03-24": [
		{
			text: "Harvard University was founded before calculus was invented",
			emoji: "🎓",
			category: "plot-twist",
		},
	],
	"03-25": [
		{
			text: "It's International Waffle Day — crispy on the outside, fluffy on the inside",
			emoji: "🧇",
			category: "national-day",
		},
	],
	"03-26": [
		{
			text: "It's Make Up Your Own Holiday Day — what will you celebrate?",
			emoji: "🎊",
			category: "national-day",
		},
	],
	"03-28": [
		{
			text: "If two mind readers read each other's minds, whose mind are they reading?",
			emoji: "🧠",
			category: "shower-thought",
		},
	],
	"03-31": [
		{
			text: "The Eiffel Tower was supposed to be temporary — it was built for the 1889 World's Fair and they just... kept it",
			emoji: "🗼",
			category: "history",
		},
	],

	// ── April ────────────────────────────────────────────────────────────
	"04-01": [
		{
			text: "April Fools' Day — trust nothing you read today",
			emoji: "🃏",
			category: "holiday",
		},
	],
	"04-02": [
		{
			text: "At some point in your life, you were the youngest person on Earth",
			emoji: "👶",
			category: "shower-thought",
		},
	],
	"04-03": [
		{
			text: "The first mobile phone call was made on this day in 1973 — it weighed 2.4 pounds",
			emoji: "📱",
			category: "history",
		},
	],
	"04-05": [
		{
			text: "You can fit all the other planets in our solar system between Earth and the Moon",
			emoji: "🌍",
			category: "plot-twist",
		},
	],
	"04-07": [
		{
			text: "It's World Health Day — take a stretch break",
			emoji: "🏥",
			category: "national-day",
		},
	],
	"04-10": [
		{
			text: "The Titanic set sail on this day in 1912 — spoiler alert: bring a lifeboat",
			emoji: "🚢",
			category: "history",
		},
	],
	"04-11": [
		{
			text: "It's National Pet Day — our furry coworkers deserve recognition",
			emoji: "🐶",
			category: "national-day",
		},
	],
	"04-12": [
		{
			text: "Yuri Gagarin became the first human in space on this day in 1961 — his entire ship had less computing power than your phone",
			emoji: "🚀",
			category: "history",
		},
	],
	"04-15": [
		{
			text: "Pluto was discovered in 1930 and still hasn't completed a single orbit around the Sun",
			emoji: "🪐",
			category: "plot-twist",
		},
	],
	"04-16": [
		{
			text: "Every time you clean something, you're just making something else dirty",
			emoji: "🧹",
			category: "shower-thought",
		},
	],
	"04-22": [
		{
			text: "Happy Earth Day! Our planet is pretty amazing",
			emoji: "🌍",
			category: "holiday",
		},
	],
	"04-23": [
		{
			text: "It's Shakespeare's birthday (and World Book Day)",
			emoji: "📚",
			category: "national-day",
			locales: ["GB", "IE"],
		},
		{
			text: "It's World Book Day — what are you reading?",
			emoji: "📚",
			category: "national-day",
		},
	],
	"04-25": [
		{
			text: "ANZAC Day — lest we forget",
			emoji: "🌺",
			category: "holiday",
			locales: ["AU"],
		},
		{
			text: "Russia has a larger surface area than Pluto",
			emoji: "🗺️",
			category: "plot-twist",
		},
	],
	"04-28": [
		{
			text: "It's National Superhero Day — who's your hero?",
			emoji: "🦸",
			category: "national-day",
		},
	],
	"04-30": [
		{
			text: "It's International Jazz Day",
			emoji: "🎷",
			category: "national-day",
		},
	],

	// ── May ──────────────────────────────────────────────────────────────
	"05-01": [
		{
			text: "Happy May Day! Welcome to the month of flowers",
			emoji: "🌸",
			category: "seasonal",
		},
	],
	"05-04": [
		{
			text: "May the Fourth be with you",
			emoji: "⚔️",
			category: "pop-culture",
		},
	],
	"05-05": [{ text: "Happy Cinco de Mayo!", emoji: "🇲🇽", category: "holiday" }],
	"05-07": [
		{
			text: "The brain named itself",
			emoji: "🧠",
			category: "shower-thought",
		},
	],
	"05-08": [
		{
			text: "VE Day — Victory in Europe, 1945",
			emoji: "🕊️",
			category: "history",
			locales: ["GB", "IE"],
		},
		{ text: "It's World Red Cross Day", emoji: "❤️", category: "national-day" },
	],
	"05-09": [
		{
			text: "The first photograph of a black hole was released on this day in 2019 — it took 2 years and 200+ scientists to develop",
			emoji: "🕳️",
			category: "history",
		},
	],
	"05-12": [
		{
			text: "Vending machines are statistically more dangerous than sharks",
			emoji: "🦈",
			category: "plot-twist",
		},
	],
	"05-15": [
		{
			text: "If you clean a vacuum cleaner, you become a vacuum cleaner",
			emoji: "🧹",
			category: "shower-thought",
		},
	],
	"05-17": [
		{
			text: "The chance of you being born was about 1 in 400 trillion. You're basically a miracle",
			emoji: "✨",
			category: "plot-twist",
		},
	],
	"05-20": [
		{
			text: "It's World Bee Day — bees pollinate 75% of leading food crops",
			emoji: "🐝",
			category: "national-day",
		},
	],
	"05-21": [
		{
			text: "Technically, we're all just fancy house plants with anxiety and schedules",
			emoji: "🪴",
			category: "shower-thought",
		},
	],
	"05-24": [
		{
			text: "Happy Victoria Day!",
			emoji: "👑",
			category: "holiday",
			locales: ["CA"],
		},
	],
	"05-25": [
		{
			text: "It's Towel Day — a tribute to Douglas Adams. Don't panic!",
			emoji: "🚀",
			category: "pop-culture",
		},
	],
	"05-28": [
		{
			text: "Ian Fleming, creator of James Bond, was born today — shaken, not stirred",
			emoji: "🍸",
			category: "pop-culture",
		},
	],

	// ── June ─────────────────────────────────────────────────────────────
	"06-01": [
		{
			text: "It's the start of Pride Month — love is love",
			emoji: "🏳️‍🌈",
			category: "seasonal",
		},
	],
	"06-03": [
		{
			text: "It's World Bicycle Day — the most efficient machine ever invented",
			emoji: "🚲",
			category: "national-day",
		},
	],
	"06-05": [
		{
			text: "The letter W is the only letter whose name doesn't contain its own sound",
			emoji: "🔤",
			category: "shower-thought",
		},
	],
	"06-06": [
		{
			text: "D-Day — Allied forces landed on the beaches of Normandy in 1944",
			emoji: "🕊️",
			category: "history",
		},
	],
	"06-07": [
		{
			text: "Alan Turing was born on this day in 1912 — the father of computer science and AI",
			emoji: "💻",
			category: "history",
		},
	],
	"06-08": [
		{
			text: "It's World Oceans Day — our blue planet",
			emoji: "🌊",
			category: "national-day",
		},
	],
	"06-10": [
		{
			text: "The speed of dark is the same as the speed of light",
			emoji: "🌑",
			category: "shower-thought",
		},
	],
	"06-12": [
		{
			text: "Anne Frank began writing her diary on this day in 1942 — it's been translated into 70+ languages",
			emoji: "📔",
			category: "history",
		},
	],
	"06-14": [
		{
			text: "Happy Flag Day!",
			emoji: "🇺🇸",
			category: "holiday",
			locales: ["US"],
		},
	],
	"06-16": [
		{
			text: "Bloomsday — celebrating James Joyce's Ulysses in Dublin",
			emoji: "📖",
			category: "holiday",
			locales: ["IE"],
		},
	],
	"06-18": [
		{
			text: "The Great Wall of China is not actually visible from space with the naked eye",
			emoji: "🧱",
			category: "plot-twist",
		},
	],
	"06-20": [
		{
			text: "It's the summer solstice — the longest day of the year",
			emoji: "☀️",
			category: "seasonal",
		},
	],
	"06-21": [
		{
			text: "It's International Day of Yoga",
			emoji: "🧘",
			category: "national-day",
		},
	],
	"06-23": [
		{
			text: "You've survived 100% of your worst days so far",
			emoji: "💪",
			category: "shower-thought",
		},
	],
	"06-25": [
		{
			text: "The Wizard of Oz and Gone with the Wind both came out in 1939 — imagine that Oscar race",
			emoji: "🎬",
			category: "pop-culture",
		},
	],
	"06-30": [
		{
			text: "Procrastination is just the future you dealing with today you's problems",
			emoji: "⏳",
			category: "shower-thought",
		},
	],

	// ── July ─────────────────────────────────────────────────────────────
	"07-01": [
		{
			text: "Happy Canada Day!",
			emoji: "🇨🇦",
			category: "holiday",
			locales: ["CA"],
		},
		{
			text: "It's International Joke Day — laughter is the best medicine",
			emoji: "😂",
			category: "national-day",
		},
	],
	"07-02": [
		{
			text: "It's World UFO Day — the truth is out there",
			emoji: "🛸",
			category: "national-day",
		},
	],
	"07-04": [
		{
			text: "Happy Independence Day!",
			emoji: "🇺🇸",
			category: "holiday",
			locales: ["US"],
		},
		{
			text: "The US Declaration of Independence was adopted today in 1776 — then they still had to win the war",
			emoji: "📜",
			category: "history",
		},
	],
	"07-06": [
		{
			text: "More people have been to the Moon than have bowled a perfect 900 series",
			emoji: "🎳",
			category: "plot-twist",
		},
	],
	"07-07": [
		{
			text: "It's World Chocolate Day — the sweetest day of the year",
			emoji: "🍫",
			category: "national-day",
		},
	],
	"07-10": [
		{
			text: "If you shuffle a deck of cards properly, the order has probably never existed before in human history",
			emoji: "🃏",
			category: "plot-twist",
		},
	],
	"07-12": [
		{
			text: "The Twelfth — a public holiday in Northern Ireland",
			emoji: "🎆",
			category: "holiday",
			locales: ["GB"],
		},
	],
	"07-14": [
		{
			text: "Bastille Day in France — Vive la France!",
			emoji: "🇫🇷",
			category: "holiday",
		},
	],
	"07-17": [
		{
			text: "It's World Emoji Day 😀 — because of course it is",
			emoji: "😀",
			category: "national-day",
		},
	],
	"07-18": [
		{
			text: "Nelson Mandela was born on this day in 1918 — 27 years in prison, then became president",
			emoji: "✊",
			category: "history",
		},
	],
	"07-20": [
		{
			text: "On this day in 1969, humans first walked on the Moon — with less tech than your phone",
			emoji: "🌕",
			category: "history",
		},
	],
	"07-23": [
		{
			text: "The voice actor for Mickey Mouse married the voice actor for Minnie Mouse. In real life",
			emoji: "🐭",
			category: "pop-culture",
		},
	],
	"07-26": [
		{
			text: "Oxford University is older than the Aztec Empire. Classes started around 1096",
			emoji: "🎓",
			category: "plot-twist",
		},
	],
	"07-28": [
		{
			text: "There are more possible chess games than atoms in the observable universe",
			emoji: "♟️",
			category: "plot-twist",
		},
	],
	"07-30": [
		{
			text: "It's International Day of Friendship",
			emoji: "🤝",
			category: "national-day",
		},
	],

	// ── August ───────────────────────────────────────────────────────────
	"08-01": [
		{
			text: "It's World Wide Web Day — thanks, Tim Berners-Lee",
			emoji: "🌐",
			category: "national-day",
		},
	],
	"08-02": [
		{
			text: "It's International Beer Day — cheers!",
			emoji: "🍻",
			category: "national-day",
		},
	],
	"08-04": [
		{
			text: "A day on Venus is longer than a year on Venus. Venus is weird",
			emoji: "🪐",
			category: "plot-twist",
		},
	],
	"08-05": [
		{
			text: "The original Star Wars and the last French guillotine execution happened in the same year: 1977",
			emoji: "⚔️",
			category: "plot-twist",
		},
	],
	"08-06": [
		{
			text: "The first website went live on this day in 1991 — it was just a page explaining what the web was",
			emoji: "💻",
			category: "history",
		},
	],
	"08-08": [
		{
			text: "It's International Cat Day — the internet's favourite animal",
			emoji: "🐱",
			category: "national-day",
		},
	],
	"08-10": [
		{
			text: "The shortest complete sentence in English is 'I am' — and it's also the most profound",
			emoji: "📝",
			category: "shower-thought",
		},
	],
	"08-13": [
		{
			text: "If you dig a hole through the centre of the Earth from the US, you'd end up in the Indian Ocean, not China",
			emoji: "🌏",
			category: "plot-twist",
		},
	],
	"08-15": [
		{
			text: "The theme from Jaws is only two notes. Two notes changed how everyone feels about swimming",
			emoji: "🦈",
			category: "pop-culture",
		},
	],
	"08-19": [
		{
			text: "It's World Photography Day — every picture tells a story",
			emoji: "📸",
			category: "national-day",
		},
	],
	"08-21": [
		{
			text: "Somewhere right now, someone's shower thought became your inspirational quote",
			emoji: "🚿",
			category: "shower-thought",
		},
	],
	"08-23": [
		{
			text: "It's National Ride the Wind Day — go fly a kite!",
			emoji: "🪁",
			category: "national-day",
		},
	],
	"08-26": [
		{
			text: "It's International Dog Day",
			emoji: "🐕",
			category: "national-day",
		},
	],
	"08-29": [
		{
			text: "When you remember something, you're actually remembering the last time you remembered it, not the original event",
			emoji: "🧠",
			category: "shower-thought",
		},
	],

	// ── September ────────────────────────────────────────────────────────
	"09-01": [
		{
			text: "September is here — the unofficial start of sweater weather",
			emoji: "🍂",
			category: "seasonal",
		},
	],
	"09-02": [
		{
			text: "The dot over the letters 'i' and 'j' is called a tittle. You're welcome",
			emoji: "✏️",
			category: "shower-thought",
		},
	],
	"09-05": [
		{
			text: "Happy Labour Day!",
			emoji: "💪",
			category: "holiday",
			locales: ["US", "CA"],
		},
	],
	"09-06": [
		{
			text: "Read a Book Day — your brain will thank you",
			emoji: "📚",
			category: "national-day",
		},
	],
	"09-08": [
		{
			text: "Star Trek first aired on this day in 1966 — live long and prosper 🖖",
			emoji: "🖖",
			category: "pop-culture",
		},
	],
	"09-10": [
		{
			text: "Sharks have been around for about 400 million years — they're older than trees",
			emoji: "🦈",
			category: "plot-twist",
		},
	],
	"09-12": [
		{
			text: "The Voyager 1 spacecraft was launched on this day in 1977 — it's now the farthest human-made object from Earth",
			emoji: "🛰️",
			category: "history",
		},
	],
	"09-15": [
		{
			text: "The voice of Darth Vader didn't know he was Luke's father until the movie premiered",
			emoji: "🎬",
			category: "pop-culture",
		},
	],
	"09-18": [
		{
			text: "It's National Cheeseburger Day",
			emoji: "🍔",
			category: "national-day",
		},
	],
	"09-19": [
		{
			text: "Ahoy! It's International Talk Like a Pirate Day",
			emoji: "🏴‍☠️",
			category: "national-day",
		},
	],
	"09-21": [
		{
			text: "It's International Day of Peace",
			emoji: "☮️",
			category: "national-day",
		},
	],
	"09-22": [
		{
			text: "Happy first day of autumn! Time for cozy vibes",
			emoji: "🍁",
			category: "seasonal",
		},
	],
	"09-25": [
		{
			text: "It's World Dream Day — dream big!",
			emoji: "🌙",
			category: "national-day",
		},
	],
	"09-27": [
		{
			text: "It's World Tourism Day — where's your next adventure?",
			emoji: "✈️",
			category: "national-day",
		},
	],
	"09-29": [
		{
			text: "It's World Heart Day — take care of yours",
			emoji: "❤️",
			category: "national-day",
		},
	],

	// ── October ──────────────────────────────────────────────────────────
	"10-01": [
		{
			text: "It's International Coffee Day — fuel for great ideas",
			emoji: "☕",
			category: "national-day",
		},
	],
	"10-02": [
		{
			text: "Peanuts first appeared on this day in 1950 — good grief, that's a long run",
			emoji: "🐕",
			category: "pop-culture",
		},
	],
	"10-03": [
		{
			text: "It's October 3rd — 'On October 3rd, he asked me what day it was'",
			emoji: "📅",
			category: "pop-culture",
		},
	],
	"10-04": [
		{
			text: "Sputnik 1 was launched on this day in 1957 — the space age began with a beep",
			emoji: "🛰️",
			category: "history",
		},
	],
	"10-05": [
		{
			text: "It's World Teachers' Day — thank a teacher who made a difference",
			emoji: "📝",
			category: "national-day",
		},
	],
	"10-09": [
		{
			text: "The movie The Princess Bride was a box-office flop. It only became beloved through VHS rentals",
			emoji: "🎬",
			category: "pop-culture",
		},
	],
	"10-10": [
		{
			text: "It's World Mental Health Day — be kind to your mind",
			emoji: "🧠",
			category: "national-day",
		},
	],
	"10-14": [
		{
			text: "Happy Thanksgiving!",
			emoji: "🦃",
			category: "holiday",
			locales: ["CA"],
		},
	],
	"10-16": [
		{
			text: "It's World Food Day — good food brings people together",
			emoji: "🍽️",
			category: "national-day",
		},
	],
	"10-19": [
		{
			text: "Honey never spoils — archaeologists found 3,000-year-old honey in Egyptian tombs and it was still good",
			emoji: "🍯",
			category: "plot-twist",
		},
	],
	"10-21": [
		{
			text: "Back to the Future Day — where we're going, we don't need roads",
			emoji: "⚡",
			category: "pop-culture",
		},
	],
	"10-24": [
		{
			text: "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid",
			emoji: "🏛️",
			category: "plot-twist",
		},
	],
	"10-29": [
		{
			text: "It's National Cat Day",
			emoji: "🐈",
			category: "national-day",
			locales: ["US"],
		},
	],
	"10-31": [
		{ text: "Happy Halloween! Boo!", emoji: "🎃", category: "holiday" },
	],

	// ── November ─────────────────────────────────────────────────────────
	"11-01": [
		{
			text: "It's the start of NaNoWriMo — write that novel!",
			emoji: "✍️",
			category: "seasonal",
		},
	],
	"11-03": [
		{
			text: "Sandwich Day — celebrating the Earl of Sandwich's finest invention",
			emoji: "🥪",
			category: "national-day",
		},
	],
	"11-05": [
		{
			text: "Remember, remember, the fifth of November — Guy Fawkes Night",
			emoji: "🎆",
			category: "holiday",
			locales: ["GB"],
		},
	],
	"11-07": [
		{
			text: "The world's oldest known joke is a 4,000-year-old fart joke from ancient Sumer",
			emoji: "💨",
			category: "plot-twist",
		},
	],
	"11-09": [
		{
			text: "The Berlin Wall fell on this day in 1989 — people literally danced on the rubble",
			emoji: "🧱",
			category: "history",
		},
	],
	"11-10": [
		{
			text: "Sesame Street first aired on this day in 1969 — can you tell me how to get there?",
			emoji: "🍪",
			category: "pop-culture",
		},
	],
	"11-11": [
		{
			text: "Remembrance Day — lest we forget",
			emoji: "🌺",
			category: "holiday",
			locales: ["GB", "CA", "AU", "IE"],
		},
		{
			text: "Veterans Day — honoring those who served",
			emoji: "🇺🇸",
			category: "holiday",
			locales: ["US"],
		},
	],
	"11-13": [
		{
			text: "It's World Kindness Day — one small act can change someone's day",
			emoji: "💛",
			category: "national-day",
		},
	],
	"11-16": [
		{
			text: "The inventor of the Pringles can is buried in one. By request",
			emoji: "🥔",
			category: "plot-twist",
		},
	],
	"11-19": [
		{
			text: "It's International Men's Day",
			emoji: "💙",
			category: "national-day",
		},
	],
	"11-21": [
		{
			text: "It's World Television Day — what's your favourite show?",
			emoji: "📺",
			category: "national-day",
		},
	],
	"11-23": [
		{
			text: "Doctor Who first aired on this day in 1963 — it's bigger on the inside",
			emoji: "🔵",
			category: "pop-culture",
			locales: ["GB"],
		},
	],
	"11-25": [
		{
			text: "A group of flamingos is called a flamboyance. Obviously",
			emoji: "🦩",
			category: "shower-thought",
		},
	],
	"11-27": [
		{
			text: "Happy Thanksgiving!",
			emoji: "🦃",
			category: "holiday",
			locales: ["US"],
		},
	],
	"11-29": [
		{
			text: "The world's largest desert is Antarctica. Not the Sahara",
			emoji: "🏔️",
			category: "plot-twist",
		},
	],
	"11-30": [
		{
			text: "Happy St. Andrew's Day — Scotland's national day",
			emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
			category: "holiday",
			locales: ["GB"],
		},
	],

	// ── December ─────────────────────────────────────────────────────────
	"12-01": [
		{
			text: "It's World AIDS Day — solidarity and support",
			emoji: "🎗️",
			category: "national-day",
		},
	],
	"12-03": [
		{
			text: "It's International Day of Persons with Disabilities",
			emoji: "♿",
			category: "national-day",
		},
	],
	"12-05": [
		{
			text: "Walt Disney was born today — all it takes is a little pixie dust",
			emoji: "🏰",
			category: "pop-culture",
		},
	],
	"12-07": [
		{
			text: "Pearl Harbor Day — a date which will live in infamy (1941)",
			emoji: "🕊️",
			category: "history",
			locales: ["US"],
		},
	],
	"12-08": [
		{
			text: "John Lennon died on this day in 1980 — imagine all the people",
			emoji: "🎵",
			category: "history",
		},
	],
	"12-10": [
		{
			text: "It's Human Rights Day and Nobel Prize Day",
			emoji: "🏅",
			category: "national-day",
		},
	],
	"12-12": [
		{
			text: "Bananas are technically berries. Strawberries aren't. Botany is chaos",
			emoji: "🍌",
			category: "plot-twist",
		},
	],
	"12-14": [
		{
			text: "Alaska is simultaneously the northernmost, westernmost, AND easternmost US state",
			emoji: "🗺️",
			category: "plot-twist",
		},
	],
	"12-17": [
		{
			text: "The Wright Brothers made the first powered flight on this day in 1903 — it lasted 12 seconds",
			emoji: "✈️",
			category: "history",
		},
	],
	"12-20": [
		{
			text: "It's the eve of the winter solstice — the longest night approaches",
			emoji: "🌙",
			category: "seasonal",
		},
	],
	"12-21": [
		{
			text: "Winter solstice — the shortest day, but from here the light returns",
			emoji: "❄️",
			category: "seasonal",
		},
	],
	"12-24": [
		{
			text: "Christmas Eve — the most wonderful time of the year is almost here",
			emoji: "🎄",
			category: "holiday",
		},
	],
	"12-25": [{ text: "Merry Christmas!", emoji: "🎄", category: "holiday" }],
	"12-26": [
		{
			text: "Happy Boxing Day!",
			emoji: "🎁",
			category: "holiday",
			locales: ["GB", "CA", "AU", "IE"],
		},
	],
	"12-28": [
		{
			text: "Stan Lee was born on this day in 1922 — Excelsior!",
			emoji: "🦸",
			category: "pop-culture",
		},
	],
	"12-31": [
		{
			text: "New Year's Eve — out with the old, in with the new",
			emoji: "🥂",
			category: "holiday",
		},
	],
};

/** General-purpose messages used when no date-specific entry exists. */
export const FALLBACK_MESSAGES: DailyMessage[] = [
	// ── Factoids ─────────────────────────────────────────────────────────
	{
		text: "Octopuses have three hearts, blue blood, and nine brains",
		emoji: "🐙",
		category: "factoid",
	},
	{
		text: "Sea otters hold hands while sleeping so they don't drift apart",
		emoji: "🦦",
		category: "factoid",
	},
	{
		text: "Cows have best friends and get stressed when they're separated",
		emoji: "🐄",
		category: "factoid",
	},
	{
		text: "A bolt of lightning is five times hotter than the surface of the Sun",
		emoji: "⚡",
		category: "factoid",
	},
	{
		text: "Venus is the only planet that spins clockwise",
		emoji: "🌍",
		category: "factoid",
	},
	{
		text: "A jiffy is an actual unit of time — 1/100th of a second",
		emoji: "⚡",
		category: "factoid",
	},
	{
		text: "The first computer programmer was Ada Lovelace, in the 1840s",
		emoji: "💻",
		category: "factoid",
	},
	{
		text: "The ocean covers 71% of Earth's surface, but we've explored less than 5% of it",
		emoji: "🌊",
		category: "factoid",
	},
	{
		text: "Dolphins have names for each other and can call out to specific individuals",
		emoji: "🐬",
		category: "factoid",
	},
	{
		text: "Crows can recognise individual human faces and hold grudges",
		emoji: "🐦‍⬛",
		category: "factoid",
	},
	{
		text: "Honey bees can be trained to detect explosives",
		emoji: "🐝",
		category: "factoid",
	},
	{
		text: "Your brain uses 20% of your body's energy but makes up only 2% of your weight",
		emoji: "🧠",
		category: "factoid",
	},
	{
		text: "The tallest tree in the world is named Hyperion and is over 380 feet tall",
		emoji: "🌲",
		category: "factoid",
	},
	{
		text: "An astronaut's footprint on the Moon could last for 100 million years",
		emoji: "👣",
		category: "factoid",
	},
	{
		text: "Butterflies taste with their feet",
		emoji: "🦋",
		category: "factoid",
	},
	{
		text: "The fingerprints of koalas are virtually indistinguishable from those of humans",
		emoji: "🐨",
		category: "factoid",
	},
	{
		text: "A cloud can weigh more than a million pounds",
		emoji: "☁️",
		category: "factoid",
	},
	{
		text: "Light takes 8 minutes and 20 seconds to travel from the Sun to Earth",
		emoji: "☀️",
		category: "factoid",
	},

	// ── Shower Thoughts ─────────────────────────────────────────────────
	{
		text: "You have never been in an empty room",
		emoji: "🚪",
		category: "shower-thought",
	},
	{
		text: "The person who proofread Hitler's speeches was literally a grammar Nazi",
		emoji: "📎",
		category: "shower-thought",
	},
	{
		text: "You are the only person who has been to every single one of your birthdays",
		emoji: "🎂",
		category: "shower-thought",
	},
	{
		text: "Every mirror you've ever bought was technically used",
		emoji: "🪞",
		category: "shower-thought",
	},
	{
		text: "Your teeth are the only part of your skeleton you clean",
		emoji: "🦷",
		category: "shower-thought",
	},
	{
		text: "A group of owls is called a parliament, which explains a lot about parliaments",
		emoji: "🦉",
		category: "shower-thought",
	},
	{
		text: "Elevators are just rooms that move. That's it. That's the thought",
		emoji: "🛗",
		category: "shower-thought",
	},
	{
		text: "The 'everything bagel' should actually have more stuff on it",
		emoji: "🥯",
		category: "shower-thought",
	},
	{
		text: "The youngest photograph of you is a photograph of the oldest you've ever been at the time",
		emoji: "📸",
		category: "shower-thought",
	},
	{
		text: "Reading is just staring at a dead tree and hallucinating",
		emoji: "📖",
		category: "shower-thought",
	},
	{
		text: "Your dog doesn't know that you can make mistakes — to them, everything you do is on purpose",
		emoji: "🐕",
		category: "shower-thought",
	},
	{
		text: "The first person to hear a parrot speak must have absolutely lost it",
		emoji: "🦜",
		category: "shower-thought",
	},
	{
		text: "Swans can be gay. And that's beautiful",
		emoji: "🦢",
		category: "shower-thought",
	},

	// ── Plot Twists ─────────────────────────────────────────────────────
	{
		text: "Scotland's national animal is the unicorn. Officially",
		emoji: "🦄",
		category: "plot-twist",
	},
	{
		text: "A teaspoon of a neutron star weighs about 6 billion tons",
		emoji: "⭐",
		category: "plot-twist",
	},
	{
		text: "The total weight of all ants on Earth roughly equals the total weight of all humans",
		emoji: "🐜",
		category: "plot-twist",
	},
	{
		text: "The longest hiccupping spree lasted 68 years. Sixty-eight. Years",
		emoji: "😮",
		category: "plot-twist",
	},
	{
		text: "Wombat poop is cube-shaped — nature's most unusual packaging",
		emoji: "🟫",
		category: "plot-twist",
	},
	{
		text: "The heart of a blue whale is so big a small child could swim through its arteries",
		emoji: "🐋",
		category: "plot-twist",
	},
	{
		text: "Sloths can hold their breath longer than dolphins — up to 40 minutes",
		emoji: "🦥",
		category: "plot-twist",
	},
	{
		text: "There are more possible iterations of a chess game than atoms in the known universe",
		emoji: "♟️",
		category: "plot-twist",
	},
	{
		text: "A snail can sleep for three years. Living the dream",
		emoji: "🐌",
		category: "plot-twist",
	},
	{
		text: "Elephants are the only animals that can't jump",
		emoji: "🐘",
		category: "plot-twist",
	},
	{
		text: "There are more stars in the universe than grains of sand on all of Earth's beaches",
		emoji: "⭐",
		category: "plot-twist",
	},
	{
		text: "The average person spends about 2 weeks of their lifetime waiting for traffic lights to change",
		emoji: "🚦",
		category: "plot-twist",
	},
	{
		text: "The human nose can detect over 1 trillion scents",
		emoji: "👃",
		category: "plot-twist",
	},
];
