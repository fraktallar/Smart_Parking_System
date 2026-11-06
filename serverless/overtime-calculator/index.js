exports.handler = async (event) => {
    try {
        const { reservedEndTime, actualExitTime, hourlyRate = 50, penaltyMultiplier = 1.5 } = event;

        const reservedEnd = new Date(reservedEndTime);
        const actualExit = new Date(actualExitTime);

        const diffMs = actualExit - reservedEnd;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes <= 0) {
            return {
                statusCode: 200,
                body: {
                    isOvertime: false,
                    overtimeMinutes: 0,
                    additionalFee: 0,
                    currency: "TRY",
                    message: "Zamanında çıkış yapıldı, ek ücret bulunmuyor."
                }
            };
        }

        const overtimeHours = Math.ceil(diffMinutes / 60);
        const additionalFee = overtimeHours * hourlyRate * penaltyMultiplier;

        return {
            statusCode: 200,
            body: {
                isOvertime: true,
                overtimeMinutes: diffMinutes,
                overtimeHoursCharged: overtimeHours,
                hourlyRate,
                penaltyMultiplier,
                additionalFee,
                currency: "TRY",
                message: `${diffMinutes} dakika süre aşımı tespit edildi. Ek ücret hesaplandı.`
            }
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: { error: "Geçersiz tarih veya veri formatı." }
        };
    }
};