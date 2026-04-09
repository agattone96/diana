export interface User {
  id: string;
  name: string;
  email: string;
}

export interface HouseholdProfile {
  id?: string;
  name?: string;
  email?: string;
  trip_type: string;
  budget: number;
  adults: number;
  children: number;
  preferred_stores: string[];
  meal_coverage: string[];
  cooking_style: string[];
  dietary_rules: string[];
  exclusions: string;
  price_mode: string;
  household_summary?: string;
  reusable_planning_instructions?: string;
  custom_store_options?: string[];
  custom_meal_coverage_options?: string[];
  custom_cooking_style_options?: string[];
  custom_dietary_tags?: string[];
  reusable_exclusions?: string[];
  planner_prompt_override?: string;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
}

export interface SessionState {
  token: string | null;
  user: User | null;
  profile: HouseholdProfile | null;
}
