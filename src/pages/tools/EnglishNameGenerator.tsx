import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { pinyin } from "pinyin-pro";
import { User, Search, RefreshCw, Copy, Check } from "lucide-react";

// Mock database of names - in a real app this might be a larger JSON or API
// Structure: { name: string, gender: 'male'|'female'|'neutral', meaning: string, tags: string[] }
const nameDatabase = [
  // A
  { name: "Aaron", gender: "male", meaning: "Mountain of strength", origin: "Hebrew" },
  { name: "Ada", gender: "female", meaning: "Noble, happy", origin: "German" },
  { name: "Adam", gender: "male", meaning: "Man, earth", origin: "Hebrew" },
  { name: "Alice", gender: "female", meaning: "Noble type", origin: "German" },
  { name: "Alan", gender: "male", meaning: "Handsome, harmony", origin: "Celtic" },
  { name: "Amy", gender: "female", meaning: "Beloved", origin: "Latin" },
  { name: "Alex", gender: "neutral", meaning: "Defender of the people", origin: "Greek" },
  { name: "Andrew", gender: "male", meaning: "Strong and manly", origin: "Greek" },
  { name: "Angela", gender: "female", meaning: "Angel, messenger", origin: "Greek" },
  { name: "Anna", gender: "female", meaning: "Grace", origin: "Hebrew" },
  { name: "Arthur", gender: "male", meaning: "Bear man", origin: "Celtic" },
  { name: "Austin", gender: "male", meaning: "Great, magnificent", origin: "Latin" },
  { name: "Ava", gender: "female", meaning: "Life, bird", origin: "Latin" },
  // B
  { name: "Ben", gender: "male", meaning: "Son of the right hand", origin: "Hebrew" },
  { name: "Bella", gender: "female", meaning: "Beautiful", origin: "Italian" },
  { name: "Bill", gender: "male", meaning: "Resolute protector", origin: "German" },
  { name: "Bonnie", gender: "female", meaning: "Pretty, good", origin: "Scottish" },
  { name: "Brian", gender: "male", meaning: "Strong, virtuous", origin: "Celtic" },
  { name: "Bruce", gender: "male", meaning: "From the brushwood thicket", origin: "Scottish" },
  // C
  { name: "Carl", gender: "male", meaning: "Free man", origin: "German" },
  { name: "Catherine", gender: "female", meaning: "Pure", origin: "Greek" },
  { name: "Charles", gender: "male", meaning: "Free man", origin: "German" },
  { name: "Chloe", gender: "female", meaning: "Blooming", origin: "Greek" },
  { name: "Chris", gender: "neutral", meaning: "Bearer of Christ", origin: "Greek" },
  { name: "Claire", gender: "female", meaning: "Bright, clear", origin: "French" },
  { name: "Colin", gender: "male", meaning: "Victory of the people", origin: "Greek" },
  { name: "Cynthia", gender: "female", meaning: "Moon goddess", origin: "Greek" },
  // D
  { name: "Daniel", gender: "male", meaning: "God is my judge", origin: "Hebrew" },
  { name: "Daisy", gender: "female", meaning: "Day's eye", origin: "English" },
  { name: "David", gender: "male", meaning: "Beloved", origin: "Hebrew" },
  { name: "Diana", gender: "female", meaning: "Divine", origin: "Latin" },
  { name: "Doris", gender: "female", meaning: "Gift of the ocean", origin: "Greek" },
  { name: "Dylan", gender: "male", meaning: "Son of the sea", origin: "Welsh" },
  // E
  { name: "Edward", gender: "male", meaning: "Rich guard", origin: "English" },
  { name: "Elena", gender: "female", meaning: "Shining light", origin: "Greek" },
  { name: "Elizabeth", gender: "female", meaning: "God is my oath", origin: "Hebrew" },
  { name: "Emily", gender: "female", meaning: "Industrious", origin: "Latin" },
  { name: "Emma", gender: "female", meaning: "Whole, universal", origin: "German" },
  { name: "Eric", gender: "male", meaning: "Eternal ruler", origin: "Norse" },
  { name: "Ethan", gender: "male", meaning: "Strong, firm", origin: "Hebrew" },
  { name: "Eva", gender: "female", meaning: "Life", origin: "Hebrew" },
  { name: "Evelyn", gender: "female", meaning: "Desired", origin: "English" },
  // F
  { name: "Felix", gender: "male", meaning: "Lucky, successful", origin: "Latin" },
  { name: "Fiona", gender: "female", meaning: "White, fair", origin: "Gaelic" },
  { name: "Frank", gender: "male", meaning: "Free man", origin: "German" },
  { name: "Flora", gender: "female", meaning: "Flower", origin: "Latin" },
  // G
  { name: "Gabriel", gender: "male", meaning: "God is my strength", origin: "Hebrew" },
  { name: "Gary", gender: "male", meaning: "Spear", origin: "German" },
  { name: "George", gender: "male", meaning: "Farmer", origin: "Greek" },
  { name: "Grace", gender: "female", meaning: "Grace, charm", origin: "Latin" },
  { name: "Gloria", gender: "female", meaning: "Glory", origin: "Latin" },
  // H
  { name: "Hannah", gender: "female", meaning: "Grace", origin: "Hebrew" },
  { name: "Harry", gender: "male", meaning: "Home ruler", origin: "German" },
  { name: "Helen", gender: "female", meaning: "Light", origin: "Greek" },
  { name: "Henry", gender: "male", meaning: "Home ruler", origin: "German" },
  { name: "Howard", gender: "male", meaning: "Brave heart", origin: "German" },
  // I
  { name: "Ian", gender: "male", meaning: "God is gracious", origin: "Scottish" },
  { name: "Iris", gender: "female", meaning: "Rainbow", origin: "Greek" },
  { name: "Isabella", gender: "female", meaning: "Devoted to God", origin: "Hebrew" },
  { name: "Ivan", gender: "male", meaning: "God is gracious", origin: "Russian" },
  { name: "Ivy", gender: "female", meaning: "Faithfulness", origin: "English" },
  // J
  { name: "Jack", gender: "male", meaning: "God is gracious", origin: "English" },
  { name: "James", gender: "male", meaning: "Supplanter", origin: "Hebrew" },
  { name: "Jane", gender: "female", meaning: "God is gracious", origin: "English" },
  { name: "Jason", gender: "male", meaning: "Healer", origin: "Greek" },
  { name: "Jennifer", gender: "female", meaning: "White wave", origin: "Welsh" },
  { name: "Jerry", gender: "male", meaning: "Ruler with the spear", origin: "English" },
  { name: "Jessica", gender: "female", meaning: "Rich", origin: "Hebrew" },
  { name: "Jim", gender: "male", meaning: "Supplanter", origin: "Hebrew" },
  { name: "John", gender: "male", meaning: "God is gracious", origin: "Hebrew" },
  { name: "Joseph", gender: "male", meaning: "God will increase", origin: "Hebrew" },
  { name: "Joyce", gender: "female", meaning: "Joyous", origin: "Latin" },
  { name: "Judy", gender: "female", meaning: "Praised", origin: "Hebrew" },
  { name: "Julia", gender: "female", meaning: "Youthful", origin: "Latin" },
  { name: "Justin", gender: "male", meaning: "Just, righteous", origin: "Latin" },
  // K
  { name: "Karen", gender: "female", meaning: "Pure", origin: "Greek" },
  { name: "Kate", gender: "female", meaning: "Pure", origin: "Greek" },
  { name: "Kelly", gender: "neutral", meaning: "Warrior", origin: "Irish" },
  { name: "Kevin", gender: "male", meaning: "Handsome", origin: "Irish" },
  { name: "Kyle", gender: "male", meaning: "Narrow spit of land", origin: "Scottish" },
  // L
  { name: "Laura", gender: "female", meaning: "Laurel", origin: "Latin" },
  { name: "Leo", gender: "male", meaning: "Lion", origin: "Latin" },
  { name: "Leon", gender: "male", meaning: "Lion", origin: "Greek" },
  { name: "Lily", gender: "female", meaning: "Lily flower, pure", origin: "English" },
  { name: "Lisa", gender: "female", meaning: "God is my oath", origin: "Hebrew" },
  { name: "Louis", gender: "male", meaning: "Renowned warrior", origin: "French" },
  { name: "Lucas", gender: "male", meaning: "Light-giving", origin: "Latin" },
  { name: "Lucy", gender: "female", meaning: "Light", origin: "Latin" },
  { name: "Luna", gender: "female", meaning: "Moon", origin: "Latin" },
  // M
  { name: "Mark", gender: "male", meaning: "Warlike", origin: "Latin" },
  { name: "Mary", gender: "female", meaning: "Bitter, beloved", origin: "Hebrew" },
  { name: "Martin", gender: "male", meaning: "Warlike", origin: "Latin" },
  { name: "Matthew", gender: "male", meaning: "Gift of God", origin: "Hebrew" },
  { name: "Max", gender: "male", meaning: "Greatest", origin: "Latin" },
  { name: "May", gender: "female", meaning: "Month of May", origin: "English" },
  { name: "Mia", gender: "female", meaning: "Mine", origin: "Italian" },
  { name: "Michael", gender: "male", meaning: "Who is like God?", origin: "Hebrew" },
  { name: "Michelle", gender: "female", meaning: "Who is like God?", origin: "French" },
  { name: "Molly", gender: "female", meaning: "Star of the sea", origin: "Irish" },
  // N
  { name: "Nancy", gender: "female", meaning: "Grace", origin: "Hebrew" },
  { name: "Nathan", gender: "male", meaning: "He gave", origin: "Hebrew" },
  { name: "Neil", gender: "male", meaning: "Champion", origin: "Irish" },
  { name: "Nick", gender: "male", meaning: "Victory of the people", origin: "Greek" },
  { name: "Nicole", gender: "female", meaning: "Victory of the people", origin: "Greek" },
  { name: "Noah", gender: "male", meaning: "Rest, comfort", origin: "Hebrew" },
  { name: "Nora", gender: "female", meaning: "Light", origin: "Greek" },
  // O
  { name: "Oliver", gender: "male", meaning: "Olive tree", origin: "Latin" },
  { name: "Olivia", gender: "female", meaning: "Olive tree", origin: "Latin" },
  { name: "Oscar", gender: "male", meaning: "Divine spear", origin: "Irish" },
  { name: "Owen", gender: "male", meaning: "Well-born", origin: "Welsh" },
  // P
  { name: "Patrick", gender: "male", meaning: "Nobleman", origin: "Latin" },
  { name: "Paul", gender: "male", meaning: "Small, humble", origin: "Latin" },
  { name: "Peter", gender: "male", meaning: "Rock", origin: "Greek" },
  { name: "Philip", gender: "male", meaning: "Lover of horses", origin: "Greek" },
  { name: "Phoebe", gender: "female", meaning: "Bright, shining", origin: "Greek" },
  // Q
  { name: "Quinn", gender: "neutral", meaning: "Wisdom, reason", origin: "Irish" },
  // R
  { name: "Rachel", gender: "female", meaning: "Ewe", origin: "Hebrew" },
  { name: "Ray", gender: "male", meaning: "Wise protector", origin: "German" },
  { name: "Rebecca", gender: "female", meaning: "To tie, bind", origin: "Hebrew" },
  { name: "Rex", gender: "male", meaning: "King", origin: "Latin" },
  { name: "Richard", gender: "male", meaning: "Brave power", origin: "German" },
  { name: "Robert", gender: "male", meaning: "Bright fame", origin: "German" },
  { name: "Rose", gender: "female", meaning: "Rose flower", origin: "Latin" },
  { name: "Ruby", gender: "female", meaning: "Red gem", origin: "Latin" },
  { name: "Ryan", gender: "male", meaning: "Little king", origin: "Irish" },
  // S
  { name: "Sam", gender: "neutral", meaning: "Told by God", origin: "Hebrew" },
  { name: "Sarah", gender: "female", meaning: "Princess", origin: "Hebrew" },
  { name: "Scott", gender: "male", meaning: "From Scotland", origin: "English" },
  { name: "Sean", gender: "male", meaning: "God is gracious", origin: "Irish" },
  { name: "Sharon", gender: "female", meaning: "A fertile plain", origin: "Hebrew" },
  { name: "Simon", gender: "male", meaning: "The listener", origin: "Hebrew" },
  { name: "Sophia", gender: "female", meaning: "Wisdom", origin: "Greek" },
  { name: "Steven", gender: "male", meaning: "Crown", origin: "Greek" },
  { name: "Stella", gender: "female", meaning: "Star", origin: "Latin" },
  { name: "Susan", gender: "female", meaning: "Lily", origin: "Hebrew" },
  // T
  { name: "Ted", gender: "male", meaning: "Divine gift", origin: "Greek" },
  { name: "Thomas", gender: "male", meaning: "Twin", origin: "Hebrew" },
  { name: "Tina", gender: "female", meaning: "Little one", origin: "Latin" },
  { name: "Tom", gender: "male", meaning: "Twin", origin: "Hebrew" },
  { name: "Tony", gender: "male", meaning: "Praiseworthy", origin: "Latin" },
  { name: "Tracy", gender: "neutral", meaning: "Warlike", origin: "Irish" },
  // U
  { name: "Ursula", gender: "female", meaning: "Little bear", origin: "Latin" },
  // V
  { name: "Vanessa", gender: "female", meaning: "Butterfly", origin: "Greek" },
  { name: "Vicky", gender: "female", meaning: "Victory", origin: "Latin" },
  { name: "Victor", gender: "male", meaning: "Conqueror", origin: "Latin" },
  { name: "Vincent", gender: "male", meaning: "Conquering", origin: "Latin" },
  { name: "Vivian", gender: "female", meaning: "Alive", origin: "Latin" },
  // W
  { name: "Wayne", gender: "male", meaning: "Wagon builder", origin: "English" },
  { name: "Wendy", gender: "female", meaning: "Friend", origin: "English" },
  { name: "William", gender: "male", meaning: "Resolute protector", origin: "German" },
  { name: "Wilson", gender: "male", meaning: "Son of Will", origin: "English" },
  // X
  { name: "Xander", gender: "male", meaning: "Defender of the people", origin: "Greek" },
  // Y
  { name: "Yvonne", gender: "female", meaning: "Yew wood", origin: "French" },
  // Z
  { name: "Zachary", gender: "male", meaning: "The Lord has remembered", origin: "Hebrew" },
  { name: "Zoe", gender: "female", meaning: "Life", origin: "Greek" },
];

interface SuggestedName {
  name: string;
  gender: string;
  meaning: string;
  origin: string;
  reason: string;
}

export default function EnglishNameGenerator() {
  const { t } = useTranslation();
  const [chineseName, setChineseName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "neutral">("neutral");
  const [suggestions, setSuggestions] = useState<SuggestedName[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const generateNames = () => {
    if (!chineseName.trim()) return;

    // Get Pinyin
    const pinyinResult = pinyin(chineseName, { toneType: "none", type: "array" });
    const lastNamePinyin = pinyinResult[pinyinResult.length - 1]; // Use the last character for "given name" logic usually
    const firstLetter = lastNamePinyin ? lastNamePinyin[0].toUpperCase() : "";
    
    // Filter logic
    let matches = nameDatabase.filter((n) => {
      // Gender filter
      if (gender !== "neutral" && n.gender !== "neutral" && n.gender !== gender) {
        return false;
      }
      return true;
    });

    // Scoring/Sorting
    // 1. Same starting letter
    // 2. Sound similarity (simple check: includes the pinyin sound?)
    
    const scoredMatches = matches.map(n => {
      let score = 0;
      let reason = "";

      if (n.name.toUpperCase().startsWith(firstLetter)) {
        score += 10;
        reason = t("tools.english-name.reason_start", "Starts with same letter as your name");
      }

      // Simple sound check: if the name contains the pinyin sound
      if (n.name.toLowerCase().includes(lastNamePinyin.toLowerCase())) {
        score += 5;
        reason = t("tools.english-name.reason_sound", "Sounds similar to your name");
      }

      if (!reason) {
        reason = t("tools.english-name.reason_random", "Popular choice");
      }

      return { ...n, score, reason };
    });

    // Sort by score
    scoredMatches.sort((a, b) => b.score - a.score);

    // Pick top results, shuffle if scores are equal to give variety
    // For now just take top 12
    setSuggestions(scoredMatches.slice(0, 12));
    setHasSearched(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("tools.english-name.title", "English Name Generator")}
        description={t(
          "tools.english-name.desc",
          "Generate English names based on your Chinese name."
        )}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <User className="w-8 h-8 text-indigo-600" />
            {t("tools.english-name.title", "English Name Generator")}
          </h1>
          <p className="text-gray-600">
            {t(
              "tools.english-name.subtitle",
              "Find the perfect English name that matches your Chinese name"
            )}
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 max-w-xl mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tools.english-name.input_label", "Your Chinese Name")}
            </label>
            <input
              type="text"
              value={chineseName}
              onChange={(e) => setChineseName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={t("tools.english-name.placeholder", "e.g. 李明")}
              onKeyDown={(e) => e.key === "Enter" && generateNames()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("tools.english-name.gender_label", "Gender")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={() => setGender("male")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                {t("tools.english-name.gender_male", "Male")}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={() => setGender("female")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                {t("tools.english-name.gender_female", "Female")}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="neutral"
                  checked={gender === "neutral"}
                  onChange={() => setGender("neutral")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                {t("tools.english-name.gender_neutral", "Neutral")}
              </label>
            </div>
          </div>

          <button
            onClick={generateNames}
            disabled={!chineseName.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Search className="w-5 h-5" />
            {t("tools.english-name.generate_btn", "Generate Names")}
          </button>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {t("tools.english-name.results_title", "Suggested Names")}
              </h2>
              <button
                onClick={generateNames}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
              >
                <RefreshCw className="w-4 h-4" />
                {t("tools.english-name.refresh", "Refresh")}
              </button>
            </div>

            {suggestions.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-bold text-indigo-700">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => handleCopy(item.name)}
                        className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-900">{t("tools.english-name.meaning", "Meaning")}:</span> {item.meaning}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-900">{t("tools.english-name.origin", "Origin")}:</span> {item.origin}
                      </p>
                      <div className="pt-2 mt-2 border-t border-gray-100">
                         <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                           {item.reason}
                         </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {t("tools.english-name.no_results", "No suitable names found based on current criteria. Try different inputs.")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
