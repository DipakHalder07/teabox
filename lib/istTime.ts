// Times in the admin are always shown in Indian Standard Time, whatever the device's timezone.
const IST = "Asia/Kolkata";

type DateInput = string | number | Date;

/** "4:35 pm IST" */
export function istTime(value: DateInput) {
  return `${new Date(value).toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true })} IST`;
}

/** "23 Oct 2026, 4:35 pm IST" */
export function istDateTime(value: DateInput) {
  const date = new Date(value).toLocaleDateString("en-IN", { timeZone: IST, day: "2-digit", month: "short", year: "numeric" });
  return `${date}, ${istTime(value)}`;
}
