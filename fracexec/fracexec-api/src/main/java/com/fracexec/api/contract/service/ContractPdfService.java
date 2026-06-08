package com.fracexec.api.contract.service;

import com.fracexec.api.contract.Contract;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class ContractPdfService {

    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("America/Sao_Paulo"));

    public byte[] generate(Contract contract) throws com.lowagie.text.DocumentException {
        var engagement = contract.getEngagement();
        var need       = engagement.getNeed();
        var company    = need.getCompany();
        var profile    = engagement.getExecutiveProfile();
        var execEmail  = profile.getUser() != null ? profile.getUser().getEmail() : "N/A";

        try (var out = new ByteArrayOutputStream()) {
            var doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font title  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
            Font header = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
            Font body   = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.DARK_GRAY);

            doc.add(new Paragraph("CONTRATO DE ENGAJAMENTO EXECUTIVO FRACIONADO", title));
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("FracExec — Plataforma de Executivos Fracionados", body));
            doc.add(new Paragraph("Data de geração: " + DATE_FMT.format(contract.getGeneratedAt()), body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("1. PARTES", header));
            doc.add(new Paragraph("Empresa contratante: " + company.getLegalName() + " (CNPJ: " + company.getCnpj() + ")", body));
            doc.add(new Paragraph("Executivo: " + execEmail, body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("2. ESCOPO DO ENGAJAMENTO", header));
            if (contract.getScopeDaysPerMonth() != null)
                doc.add(new Paragraph("Dias por mês: " + contract.getScopeDaysPerMonth(), body));
            if (contract.getDurationMonths() != null)
                doc.add(new Paragraph("Duração estimada: " + contract.getDurationMonths() + " meses", body));
            if (contract.getMonthlyValue() != null)
                doc.add(new Paragraph("Valor mensal: R$ " + contract.getMonthlyValue(), body));
            doc.add(new Paragraph("Descrição da necessidade: " + need.getChallengeDescription().substring(
                0, Math.min(300, need.getChallengeDescription().length())) + "...", body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("3. CLÁUSULA DE CONFIDENCIALIDADE", header));
            doc.add(new Paragraph(
                "As partes se comprometem a manter em sigilo todas as informações confidenciais " +
                "obtidas no âmbito deste engajamento, incluindo dados estratégicos, financeiros e " +
                "operacionais da empresa contratante.", body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("4. DECLARAÇÃO DE CONFLITO DE INTERESSES", header));
            doc.add(new Paragraph(
                "O executivo declara não possuir conflito de interesses que impeça a prestação dos " +
                "serviços descritos neste contrato, conforme verificado pela plataforma FracExec.", body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("5. CONDIÇÕES DE RESCISÃO", header));
            doc.add(new Paragraph(
                "Qualquer das partes pode rescindir este contrato mediante aviso prévio de 30 dias, " +
                "sem penalidade, exceto em caso de descumprimento de cláusulas essenciais.", body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Assinatura registrada via plataforma FracExec.", body));

            doc.close();
            return out.toByteArray();
        } catch (com.lowagie.text.DocumentException e) {
            throw new com.lowagie.text.DocumentException("Erro ao gerar contrato PDF: " + e.getMessage());
        } catch (Exception e) {
            throw new com.lowagie.text.DocumentException("Erro inesperado ao gerar contrato PDF: " + e.getMessage());
        }
    }
}
