export interface DefaultCategoryDef {
  name: string;
  type: "fixed" | "variable" | "sinking_fund";
  description: string;
  defaultMonthly: number;
  isSubscription?: boolean;
}

export const DEFAULT_FIXED_CATEGORIES: DefaultCategoryDef[] = [
  { name: "Rent / Mortgage", type: "fixed", description: "Primary shelter & housing", defaultMonthly: 1500 },
  { name: "Electricity", type: "fixed", description: "Power & cooling baseline", defaultMonthly: 120 },
  { name: "Natural Gas / Heating", type: "fixed", description: "Gas heating & stove", defaultMonthly: 65 },
  { name: "Water, Sewer & Trash", type: "fixed", description: "Municipal city utility", defaultMonthly: 60 },
  { name: "Home Internet", type: "fixed", description: "High-speed broadband", defaultMonthly: 70 },
  { name: "Mobile Phone Service", type: "fixed", description: "Cellular phone plan", defaultMonthly: 75 },
  { name: "Health & Dental Insurance", type: "fixed", description: "Monthly medical coverage", defaultMonthly: 250 },
  { name: "Auto Insurance", type: "fixed", description: "Monthly car policy", defaultMonthly: 130 },
  { name: "Car Loan / Commute", type: "fixed", description: "Auto note or transit pass", defaultMonthly: 350 },
  { name: "Term Life Insurance", type: "fixed", description: "Income protection policy", defaultMonthly: 35 },
  { name: "Childcare / Tuition", type: "fixed", description: "Daycare or school baseline", defaultMonthly: 0 },
];

export const DEFAULT_VARIABLE_CATEGORIES: DefaultCategoryDef[] = [
  { name: "Groceries & Supermarket", type: "variable", description: "Food & home staples", defaultMonthly: 450 },
  { name: "Dining Out & Delivery", type: "variable", description: "Restaurants, cafes, takeout", defaultMonthly: 200 },
  { name: "Gasoline & Transit", type: "variable", description: "Commute fuel & tolls", defaultMonthly: 140 },
  { name: "Personal Care & Haircuts", type: "variable", description: "Hygiene, grooming, salon", defaultMonthly: 60 },
  { name: "Household Supplies", type: "variable", description: "Detergent, paper towels, cleaners", defaultMonthly: 50 },
  { name: "Pet Food & Routine Care", type: "variable", description: "Pet nutrition & supplies", defaultMonthly: 65 },
  { name: "Streaming & Media Subscriptions", type: "variable", description: "Netflix, Spotify, Hulu", defaultMonthly: 45, isSubscription: true },
  { name: "Fitness & Gym Membership", type: "variable", description: "Gym, yoga, fitness apps", defaultMonthly: 50, isSubscription: true },
  { name: "Software & Cloud Services", type: "variable", description: "iCloud, Google, password mgr", defaultMonthly: 20, isSubscription: true },
  { name: "Clothing & Footwear", type: "variable", description: "Apparel & work clothes", defaultMonthly: 75 },
  { name: "Recreation & Hobbies", type: "variable", description: "Movies, books, outings", defaultMonthly: 100 },
];

export const DEFAULT_SINKING_CATEGORIES: DefaultCategoryDef[] = [
  { name: "Auto Maintenance & Tires", type: "sinking_fund", description: "Oil, brakes, tire replacement", defaultMonthly: 75 },
  { name: "Medical / Dental Deductible", type: "sinking_fund", description: "Copays, prescriptions, ER buffer", defaultMonthly: 60 },
  { name: "Home / Appliance Repairs", type: "sinking_fund", description: "Plumbing, roof, appliance fixes", defaultMonthly: 80 },
  { name: "Vehicle Registration & Fees", type: "sinking_fund", description: "Annual tags, licenses, taxes", defaultMonthly: 25 },
  { name: "Holiday & Birthday Gifts", type: "sinking_fund", description: "Year-end & family celebrations", defaultMonthly: 50 },
  { name: "Travel & Vacation Reserve", type: "sinking_fund", description: "Annual getaway funding", defaultMonthly: 100 },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_FIXED_CATEGORIES,
  ...DEFAULT_VARIABLE_CATEGORIES,
  ...DEFAULT_SINKING_CATEGORIES,
];
