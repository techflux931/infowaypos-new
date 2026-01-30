package com.pos.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pos.model.Quote;
import com.pos.model.QuoteItem;
import com.pos.repository.QuoteRepository;
import com.pos.service.QuoteService;

@Service
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;

    public QuoteServiceImpl(QuoteRepository quoteRepository) {
        this.quoteRepository = quoteRepository;
    }

    @Override
    public Quote saveQuote(Quote quote) {
        quote.setTotalAmount(computeTotalAmount(quote));
        return quoteRepository.save(quote);
    }

    @Override
    public List<Quote> getAllQuotes() {
        return quoteRepository.findAll();
    }

    @Override
    public Quote getQuoteById(String id) {
        return quoteRepository.findById(id).orElse(null);
    }

    @Override
    public void deleteQuote(String id) {
        quoteRepository.deleteById(id);
    }

    // -------- helpers --------

    private double computeTotalAmount(Quote q) {
        if (q == null || q.getItems() == null) return 0d;

        double subtotal = 0d;
        double taxTotal = 0d;

        for (QuoteItem it : q.getItems()) {
            if (it == null) continue;

            double qty   = it.getQty();   // primitives -> never null
            double price = it.getPrice();
            double lineSub = qty * price;
            subtotal += lineSub;

            double ratePct = taxRatePct(it); // percent
            double lineTax = lineSub * (ratePct / 100d);
            taxTotal += lineTax;
        }

        return round2(subtotal + taxTotal);
    }

    /** Business rule: blank/zero tax means 5% by default. */
    private double taxRatePct(QuoteItem it) {
        double t = it.getTax();          // primitive double
        return (t > 0d) ? t : 5d;
    }

    private static double round2(double v) {
        return Math.round(v * 100d) / 100d;
    }
}
