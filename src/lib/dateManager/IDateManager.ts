
export interface IDateManager {
    now(): Date;
    utcNow(): Date;
    formatUtcNow(dateFormat?: string): string;
}
