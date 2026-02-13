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
			text: "The first patent for a ballpoint pen was issued in 1888",
			emoji: "🖊️",
			category: "history",
		},
	],
	"01-03": [
		{
			text: "Alaska became the 49th US state on this day in 1959",
			emoji: "🏔️",
			category: "history",
			locales: ["US"],
		},
		{
			text: "J.R.R. Tolkien was born on this day in 1892",
			emoji: "📖",
			category: "history",
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
			text: "Amelia Earhart became the first woman to fly solo across the Pacific in 1935",
			emoji: "✈️",
			category: "history",
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
			text: "The first commercial transatlantic phone call was made in 1927",
			emoji: "📞",
			category: "history",
		},
	],
	"01-08": [
		{
			text: "Elvis Presley was born on this day in 1935",
			emoji: "🎸",
			category: "history",
		},
	],
	"01-09": [
		{
			text: "The first iPhone was announced on this day in 2007",
			emoji: "📱",
			category: "history",
		},
	],
	"01-10": [
		{
			text: "The London Underground opened on this day in 1863 — the world's first",
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
	"01-11": [
		{
			text: "Amelia Earhart became the first person to fly solo from Hawaii to California in 1935",
			emoji: "🌺",
			category: "history",
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
			text: "The Simpsons first aired on this day in 1990",
			emoji: "📺",
			category: "history",
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
			text: "Wikipedia launched on this day in 2001",
			emoji: "📚",
			category: "history",
		},
	],
	"01-17": [
		{
			text: "Benjamin Franklin was born on this day in 1706",
			emoji: "⚡",
			category: "history",
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
			text: "The first episode of the TV show Friends aired... wait, no — that's in September",
			emoji: "😄",
			category: "factoid",
		},
	],
	"01-24": [
		{
			text: "Gold was discovered at Sutter's Mill in 1848, sparking the California Gold Rush",
			emoji: "⛏️",
			category: "history",
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
			text: "It's National Peanut Brittle Day",
			emoji: "🥜",
			category: "national-day",
		},
	],
	"01-27": [
		{
			text: "Mozart was born on this day in 1756",
			emoji: "🎵",
			category: "history",
		},
	],
	"01-28": [
		{
			text: "LEGO was patented on this day in 1958",
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
			text: "Gandhi was assassinated on this day in 1948",
			emoji: "🕊️",
			category: "history",
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
		{ text: "It's World Wetlands Day", emoji: "🌿", category: "national-day" },
	],
	"02-04": [
		{
			text: "Facebook launched on this day in 2004",
			emoji: "👍",
			category: "history",
		},
	],
	"02-05": [
		{
			text: "It's National Weatherperson's Day — thank your local forecaster",
			emoji: "🌦️",
			category: "national-day",
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
			text: "Charles Dickens was born on this day in 1812",
			emoji: "📚",
			category: "history",
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
			text: "Thomas Edison was born on this day in 1847",
			emoji: "💡",
			category: "history",
		},
	],
	"02-12": [
		{
			text: "Abraham Lincoln and Charles Darwin were both born on this day in 1809",
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
		{
			text: "George Washington was born on this day in 1732",
			emoji: "🇺🇸",
			category: "history",
			locales: ["US"],
		},
		{ text: "It's World Thinking Day", emoji: "💭", category: "national-day" },
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
			text: "The original Star-Spangled Banner was made official on this day in 1931",
			emoji: "🇺🇸",
			category: "history",
			locales: ["US"],
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
			text: "Chuck Norris was born on this day in 1940",
			emoji: "🥋",
			category: "history",
		},
	],
	"03-12": [
		{
			text: "The World Wide Web was invented on this day in 1989",
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
	"03-31": [
		{
			text: "The Eiffel Tower was officially opened on this day in 1889",
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
			text: "Hans Christian Andersen was born on this day in 1805",
			emoji: "📖",
			category: "history",
		},
	],
	"04-03": [
		{
			text: "The first mobile phone call was made on this day in 1973",
			emoji: "📱",
			category: "history",
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
			text: "The Titanic set sail on this day in 1912",
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
			text: "Yuri Gagarin became the first human in space on this day in 1961",
			emoji: "🚀",
			category: "history",
		},
	],
	"04-15": [
		{
			text: "Leonardo da Vinci was born on this day in 1452",
			emoji: "🎨",
			category: "history",
		},
	],
	"04-16": [
		{
			text: "Charlie Chaplin was born on this day in 1889",
			emoji: "🎬",
			category: "history",
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
	"05-03": [
		{
			text: "It's World Press Freedom Day",
			emoji: "📰",
			category: "national-day",
		},
	],
	"05-04": [
		{ text: "May the Fourth be with you", emoji: "⚔️", category: "seasonal" },
	],
	"05-05": [{ text: "Happy Cinco de Mayo!", emoji: "🇲🇽", category: "holiday" }],
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
			text: "The first photograph of a black hole was released on this day in 2019",
			emoji: "🕳️",
			category: "history",
		},
	],
	"05-12": [
		{
			text: "Florence Nightingale was born on this day in 1820 — it's International Nurses Day",
			emoji: "🏥",
			category: "history",
		},
	],
	"05-15": [
		{
			text: "It's International Day of Families",
			emoji: "👨‍👩‍👧‍👦",
			category: "national-day",
		},
	],
	"05-17": [
		{
			text: "It's World Telecommunication Day",
			emoji: "📡",
			category: "national-day",
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
			text: "Amelia Earhart completed her transatlantic solo flight on this day in 1932",
			emoji: "✈️",
			category: "history",
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
			category: "national-day",
		},
	],
	"05-28": [
		{
			text: "Ian Fleming, creator of James Bond, was born on this day in 1908",
			emoji: "🍸",
			category: "history",
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
			text: "It's World Environment Day",
			emoji: "🌿",
			category: "national-day",
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
			text: "Alan Turing was born on this day in 1912",
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
	"06-12": [
		{
			text: "Anne Frank began writing her diary on this day in 1942",
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
			text: "Alan Turing's birthday is recognised as a celebration of computing",
			emoji: "🖥️",
			category: "history",
		},
	],
	"06-25": [
		{
			text: "George Orwell's Nineteen Eighty-Four was published on this day in 1949",
			emoji: "📕",
			category: "history",
		},
	],
	"06-30": [
		{
			text: "The first leap second was added to UTC on this day in 1972",
			emoji: "⏱️",
			category: "history",
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
			text: "The US Declaration of Independence was adopted on this day in 1776",
			emoji: "📜",
			category: "history",
		},
	],
	"07-06": [
		{
			text: "The first rabies vaccine was given on this day in 1885 by Louis Pasteur",
			emoji: "💉",
			category: "history",
		},
	],
	"07-07": [
		{
			text: "It's World Chocolate Day — the sweetest day of the year",
			emoji: "🍫",
			category: "national-day",
		},
	],
	"07-11": [
		{
			text: "It's World Population Day",
			emoji: "🌍",
			category: "national-day",
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
			text: "Nelson Mandela was born on this day in 1918",
			emoji: "✊",
			category: "history",
		},
	],
	"07-20": [
		{
			text: "On this day in 1969, humans first walked on the Moon",
			emoji: "🌕",
			category: "history",
		},
	],
	"07-26": [
		{
			text: "The FBI was founded on this day in 1908",
			emoji: "🔍",
			category: "history",
		},
	],
	"07-28": [
		{
			text: "Beatrix Potter was born on this day in 1866",
			emoji: "🐰",
			category: "history",
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
	"08-05": [
		{
			text: "Neil Armstrong was born on this day in 1930",
			emoji: "👨‍🚀",
			category: "history",
		},
	],
	"08-06": [
		{
			text: "The first website went live on this day in 1991",
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
			text: "The Smithsonian Institution was established on this day in 1846",
			emoji: "🏛️",
			category: "history",
		},
	],
	"08-12": [
		{
			text: "It's International Youth Day",
			emoji: "🌟",
			category: "national-day",
		},
	],
	"08-13": [
		{
			text: "Alfred Hitchcock was born on this day in 1899",
			emoji: "🎬",
			category: "history",
		},
	],
	"08-17": [
		{
			text: "It's National Nonprofit Day — celebrate the people making a difference",
			emoji: "💙",
			category: "national-day",
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
			text: "Hawaii became the 50th US state on this day in 1959",
			emoji: "🌺",
			category: "history",
			locales: ["US"],
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
			text: "The 19th Amendment was ratified on this day in 1920, granting women the right to vote",
			emoji: "🗳️",
			category: "history",
			locales: ["US"],
		},
		{
			text: "It's International Dog Day",
			emoji: "🐕",
			category: "national-day",
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
			text: "VJ Day — the end of World War II in 1945",
			emoji: "🕊️",
			category: "history",
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
			text: "Star Trek first aired on this day in 1966",
			emoji: "🖖",
			category: "history",
		},
	],
	"09-12": [
		{
			text: "The Voyager 1 spacecraft was launched on this day in 1977",
			emoji: "🛰️",
			category: "history",
		},
	],
	"09-15": [
		{
			text: "It's International Day of Democracy",
			emoji: "🗳️",
			category: "national-day",
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
	"09-28": [
		{
			text: "It's International Right to Know Day",
			emoji: "📢",
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
	"09-30": [
		{
			text: "It's International Translation Day — thank a translator",
			emoji: "🌍",
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
			text: "Peanuts (the comic strip) first appeared on this day in 1950",
			emoji: "🐕",
			category: "history",
		},
	],
	"10-03": [
		{
			text: "It's Mean Girls Day — on October 3rd, he asked me what day it was",
			emoji: "📅",
			category: "seasonal",
		},
	],
	"10-04": [
		{
			text: "Sputnik 1, the first satellite, was launched on this day in 1957",
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
			text: "John Lennon was born on this day in 1940",
			emoji: "🎵",
			category: "history",
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
	"10-21": [
		{
			text: "Back to the Future Day — where we're going, we don't need roads",
			emoji: "⚡",
			category: "seasonal",
		},
	],
	"10-24": [
		{ text: "It's United Nations Day", emoji: "🇺🇳", category: "national-day" },
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
		{
			text: "Guy Fawkes and the Gunpowder Plot were foiled on this day in 1605",
			emoji: "💥",
			category: "history",
		},
	],
	"11-09": [
		{
			text: "The Berlin Wall fell on this day in 1989",
			emoji: "🧱",
			category: "history",
		},
	],
	"11-10": [
		{
			text: "Sesame Street first aired on this day in 1969",
			emoji: "🍪",
			category: "history",
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
	"11-15": [
		{
			text: "It's America Recycles Day",
			emoji: "♻️",
			category: "national-day",
			locales: ["US"],
		},
	],
	"11-16": [
		{
			text: "It's International Day for Tolerance",
			emoji: "🤝",
			category: "national-day",
		},
	],
	"11-19": [
		{
			text: "Abraham Lincoln delivered the Gettysburg Address on this day in 1863",
			emoji: "📜",
			category: "history",
			locales: ["US"],
		},
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
			text: "Doctor Who first aired on this day in 1963",
			emoji: "🔵",
			category: "history",
			locales: ["GB"],
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
			text: "Louisa May Alcott was born on this day in 1832",
			emoji: "📖",
			category: "history",
		},
	],
	"11-30": [
		{
			text: "Happy St. Andrew's Day — Scotland's national day",
			emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
			category: "holiday",
			locales: ["GB"],
		},
		{
			text: "Mark Twain was born on this day in 1835",
			emoji: "📚",
			category: "history",
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
			text: "Walt Disney was born on this day in 1901",
			emoji: "🏰",
			category: "history",
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
			text: "The first transatlantic radio signal was received on this day in 1901",
			emoji: "📡",
			category: "history",
		},
	],
	"12-14": [
		{
			text: "Roald Amundsen reached the South Pole on this day in 1911",
			emoji: "🧊",
			category: "history",
		},
	],
	"12-17": [
		{
			text: "The Wright Brothers made the first powered flight on this day in 1903",
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
			category: "history",
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

/** General-purpose factoids used when no date-specific entry exists. */
export const FALLBACK_MESSAGES: DailyMessage[] = [
	{
		text: "Honey never spoils — archaeologists found 3,000-year-old honey in Egyptian tombs and it was still edible",
		emoji: "🍯",
		category: "factoid",
	},
	{
		text: "Octopuses have three hearts, blue blood, and nine brains",
		emoji: "🐙",
		category: "factoid",
	},
	{
		text: "A group of flamingos is called a flamboyance",
		emoji: "🦩",
		category: "factoid",
	},
	{
		text: "Bananas are berries, but strawberries aren't",
		emoji: "🍌",
		category: "factoid",
	},
	{
		text: "The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896)",
		emoji: "⏱️",
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
		text: "Scotland's national animal is the unicorn",
		emoji: "🦄",
		category: "factoid",
	},
	{
		text: "The first computer programmer was Ada Lovelace, in the 1840s",
		emoji: "💻",
		category: "factoid",
	},
	{
		text: "The ocean covers 71% of the Earth's surface, but we've explored less than 5% of it",
		emoji: "🌊",
		category: "factoid",
	},
	{
		text: "Cows have best friends and get stressed when they're separated",
		emoji: "🐄",
		category: "factoid",
	},
	{
		text: "The inventor of the Pringles can is buried in one",
		emoji: "🥔",
		category: "factoid",
	},
	{
		text: "A bolt of lightning is five times hotter than the surface of the sun",
		emoji: "⚡",
		category: "factoid",
	},
	{
		text: "The average person walks about 100,000 miles in their lifetime",
		emoji: "🚶",
		category: "factoid",
	},
	{
		text: "The world's oldest known joke is a 4,000-year-old fart joke from Sumer",
		emoji: "😄",
		category: "factoid",
	},
	{
		text: "Sea otters hold hands while sleeping so they don't drift apart",
		emoji: "🦦",
		category: "factoid",
	},
	{
		text: "The dot over the letters 'i' and 'j' is called a tittle",
		emoji: "✏️",
		category: "factoid",
	},
	{
		text: "A cloud can weigh more than a million pounds",
		emoji: "☁️",
		category: "factoid",
	},
	{
		text: "The fingerprints of koalas are virtually indistinguishable from those of humans",
		emoji: "🐨",
		category: "factoid",
	},
	{
		text: "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid",
		emoji: "🏛️",
		category: "factoid",
	},
	{
		text: "Wombat poop is cube-shaped — nature's most unusual packaging",
		emoji: "🟫",
		category: "factoid",
	},
	{
		text: "The heart of a blue whale is so big a small child could swim through its arteries",
		emoji: "🐋",
		category: "factoid",
	},
	{
		text: "Sloths can hold their breath longer than dolphins — up to 40 minutes",
		emoji: "🦥",
		category: "factoid",
	},
	{
		text: "Oxford University is older than the Aztec Empire",
		emoji: "🎓",
		category: "factoid",
	},
	{
		text: "A teaspoon of a neutron star weighs about 6 billion tons",
		emoji: "⭐",
		category: "factoid",
	},
	{
		text: "There are more possible iterations of a chess game than atoms in the known universe",
		emoji: "♟️",
		category: "factoid",
	},
	{
		text: "The total weight of all ants on Earth is roughly equal to the total weight of all humans",
		emoji: "🐜",
		category: "factoid",
	},
	{
		text: "The longest hiccupping spree lasted 68 years",
		emoji: "😮",
		category: "factoid",
	},
	{
		text: "The shortest complete sentence in English is 'I am'",
		emoji: "📝",
		category: "factoid",
	},
	{
		text: "Light takes 8 minutes and 20 seconds to travel from the Sun to Earth",
		emoji: "☀️",
		category: "factoid",
	},
	{
		text: "The great wall of China is not actually visible from space with the naked eye",
		emoji: "🧱",
		category: "factoid",
	},
	{
		text: "A day on Venus is longer than a year on Venus",
		emoji: "🪐",
		category: "factoid",
	},
	{
		text: "Sharks are older than trees — they've been around for about 400 million years",
		emoji: "🦈",
		category: "factoid",
	},
	{
		text: "The human nose can detect over 1 trillion scents",
		emoji: "👃",
		category: "factoid",
	},
	{
		text: "Butterflies taste with their feet",
		emoji: "🦋",
		category: "factoid",
	},
	{
		text: "A group of owls is called a parliament",
		emoji: "🦉",
		category: "factoid",
	},
	{
		text: "Alaska is simultaneously the most northern, western, AND eastern US state",
		emoji: "🗺️",
		category: "factoid",
	},
	{
		text: "Dolphins have names for each other and can call out to specific individuals",
		emoji: "🐬",
		category: "factoid",
	},
	{
		text: "The world's largest desert is Antarctica",
		emoji: "🏔️",
		category: "factoid",
	},
	{
		text: "An astronaut's footprint on the Moon could last for 100 million years",
		emoji: "👣",
		category: "factoid",
	},
	{
		text: "There are more stars in the universe than grains of sand on all of Earth's beaches",
		emoji: "⭐",
		category: "factoid",
	},
	{
		text: "Crows can recognise individual human faces and hold grudges",
		emoji: "🐦‍⬛",
		category: "factoid",
	},
	{
		text: "The average person spends about 2 weeks of their lifetime waiting for traffic lights",
		emoji: "🚦",
		category: "factoid",
	},
	{
		text: "Honey bees can be trained to detect explosives",
		emoji: "🐝",
		category: "factoid",
	},
	{
		text: "The tongue is the only muscle in the body attached at only one end",
		emoji: "👅",
		category: "factoid",
	},
	{
		text: "Your brain uses about 20% of your body's energy but makes up only 2% of your weight",
		emoji: "🧠",
		category: "factoid",
	},
	{
		text: "The tallest tree in the world is named Hyperion and is over 380 feet tall",
		emoji: "🌲",
		category: "factoid",
	},
	{
		text: "A snail can sleep for three years",
		emoji: "🐌",
		category: "factoid",
	},
	{
		text: "The average cumulus cloud weighs about 1.1 million pounds",
		emoji: "⛅",
		category: "factoid",
	},
	{
		text: "Elephants are the only animals that can't jump",
		emoji: "🐘",
		category: "factoid",
	},
];
