package com.fracexec.api.shared.util;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

class BusinessDayCalculatorTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Test
    void addBusinessDays_pulaSabadoEDomingo() {
        // Quinta-feira + 3 dias úteis = terça-feira (pula sáb + dom)
        var quinta = java.time.LocalDate.of(2025, 1, 2) // quinta
            .atStartOfDay(SP).toInstant();
        var result = BusinessDayCalculator.addBusinessDays(quinta, 3);
        var dow = result.atZone(SP).toLocalDate().getDayOfWeek();
        // +3 dias úteis a partir de quinta: sex(1), seg(2), ter(3)
        assertEquals(DayOfWeek.TUESDAY, dow);
    }

    @Test
    void addBusinessDays_zeroDias_retornaMesmoDia() {
        var segunda = java.time.LocalDate.of(2025, 1, 6)
            .atStartOfDay(SP).toInstant();
        var result = BusinessDayCalculator.addBusinessDays(segunda, 0);
        // 0 dias úteis = mesmo dia (loop não executa)
        assertEquals(
            segunda.atZone(SP).toLocalDate(),
            result.atZone(SP).toLocalDate()
        );
    }

    @Test
    void addBusinessDays_iniciandoNaSexta_pula5Dias() {
        var sexta = java.time.LocalDate.of(2025, 1, 3) // sexta
            .atStartOfDay(SP).toInstant();
        var result = BusinessDayCalculator.addBusinessDays(sexta, 5);
        var resultDate = result.atZone(SP).toLocalDate();
        // sex + 5 dias úteis: seg(1),ter(2),qua(3),qui(4),sex(5) = próxima sexta
        assertEquals(DayOfWeek.FRIDAY, resultDate.getDayOfWeek());
    }

    @Test
    void businessDaysUntil_dataFutura_retornaPositivo() {
        var futuro = Instant.now().plusSeconds(3600L * 24 * 7); // +7 dias
        long days = BusinessDayCalculator.businessDaysUntil(futuro);
        assertTrue(days >= 4, "7 dias corridos devem ter ao menos 4 dias úteis");
    }

    @Test
    void businessDaysUntil_dataHoje_retornaZeroOuNegativo() {
        var hoje = Instant.now();
        long days = BusinessDayCalculator.businessDaysUntil(hoje);
        // Conta hoje se for dia útil menos 1 = 0; fim de semana pode ser -1
        assertTrue(days <= 1);
    }

    @Test
    void businessDaysUntil_dataPassada_retornaNegativoOuZero() {
        var passado = Instant.now().minusSeconds(3600L * 24 * 3);
        long days = BusinessDayCalculator.businessDaysUntil(passado);
        assertTrue(days <= 0);
    }
}
