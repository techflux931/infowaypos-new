package com.pos.service;

import com.pos.model.Quote;

import java.util.List;

public interface QuoteService {
    Quote saveQuote(Quote quote);
    List<Quote> getAllQuotes();
    Quote getQuoteById(String id);
    void deleteQuote(String id);
}