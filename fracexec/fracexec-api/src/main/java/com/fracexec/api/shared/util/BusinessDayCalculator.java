package com.fracexec.api.shared.util;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public final class BusinessDayCalculator {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

    private BusinessDayCalculator() {}

    public static Instant addBusinessDays(Instant start, int days) {
        LocalDate date = start.atZone(SAO_PAULO).toLocalDate();
        int added = 0;
        while (added < days) {
            date = date.plusDays(1);
            DayOfWeek dow = date.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                added++;
            }
        }
        return date.atStartOfDay(SAO_PAULO).toInstant();
    }

    public static long businessDaysUntil(Instant deadline) {
        LocalDate today    = LocalDate.now(SAO_PAULO);
        LocalDate deadlineDate = deadline.atZone(SAO_PAULO).toLocalDate();
        long count = 0;
        LocalDate cursor = today;
        while (!cursor.isAfter(deadlineDate)) {
            DayOfWeek dow = cursor.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                count++;
            }
            cursor = cursor.plusDays(1);
        }
        return count - 1; // não conta o deadline em si
    }
}
