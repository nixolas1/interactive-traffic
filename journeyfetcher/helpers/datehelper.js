
/**
 * Get the number of days in any particular month
 */
const daysInMonth = (m, y) => {
    switch (m) {
        case 1 :
            return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
        case 8 :
        case 3 :
        case 5 :
        case 10 :
            return 30;
        default :
            return 31;
    }
};

/**
 * Check if a date is valid
 */
const isValidDate = (d, m, y) => {
    m = parseInt(m, 10) - 1;
    return m >= 0 && m < 12 && d > 0 && d <= daysInMonth(m, y);
};

module.exports = {isValidDate};
