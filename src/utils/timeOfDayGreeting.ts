export type TimeOfDayPeriod = "morning" | "afternoon" | "evening" | "night";

export function getTimeOfDayPeriod(date = new Date()): TimeOfDayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "morning";
  }
  if (hour >= 12 && hour < 18) {
    return "afternoon";
  }
  if (hour >= 18 && hour < 23) {
    return "evening";
  }
  return "night";
}

export function getTimeOfDayGreetingKey(date = new Date()): string {
  const period = getTimeOfDayPeriod(date);
  const suffix = period.charAt(0).toUpperCase() + period.slice(1);
  return `profile.greeting${suffix}`;
}
