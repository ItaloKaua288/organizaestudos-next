export const getTodayBR = (): Date => {
    const brString = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const today = new Date(brString);
    today.setHours(0, 0, 0, 0);
    return today;
};

export const isToday = (date: Date | string): boolean => {
    if (!date) return false;
    const targetUTC = new Date(date);
    if (isNaN(targetUTC.getTime())) return false;

    const target = new Date(
        targetUTC.getUTCFullYear(),
        targetUTC.getUTCMonth(),
        targetUTC.getUTCDate()
    );

    const today = getTodayBR();

    return today.getTime() === target.getTime();
};

export const isDateOverdue = (dateString: string | Date | undefined): boolean => {
    if (!dateString) return false;

    const reviewDateUTC = new Date(dateString);
    if (isNaN(reviewDateUTC.getTime())) return false;

    const reviewDate = new Date(
        reviewDateUTC.getUTCFullYear(),
        reviewDateUTC.getUTCMonth(),
        reviewDateUTC.getUTCDate()
    );

    const today = getTodayBR();

    return today.getTime() >= reviewDate.getTime();
};