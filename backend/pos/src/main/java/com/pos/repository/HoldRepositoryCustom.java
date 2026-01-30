package com.pos.repository;

import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.pos.model.Hold;

public interface HoldRepositoryCustom {
    Page<Hold> search(String q, Date from, Date to, Pageable pageable);
}
