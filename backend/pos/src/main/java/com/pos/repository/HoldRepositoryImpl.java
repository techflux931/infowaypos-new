package com.pos.repository;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import com.pos.model.Hold;

@Repository
public class HoldRepositoryImpl implements HoldRepositoryCustom {

    @Autowired
    private MongoTemplate mongo;

    @Override
    public Page<Hold> search(String q, Date from, Date to, Pageable pageable) {
        List<Criteria> and = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            String rx = "(?i).*" + Pattern.quote(q) + ".*";
            and.add(new Criteria().orOperator(
                where("_id").regex(rx),
                where("customerName").regex(rx),
                where("cashier").regex(rx)
            ));
        }
        if (from != null || to != null) {
            Criteria c = where("date");
            if (from != null && to != null) {
                Calendar cal = Calendar.getInstance();
                cal.setTime(to);
                cal.set(Calendar.HOUR_OF_DAY, 23);
                cal.set(Calendar.MINUTE, 59);
                cal.set(Calendar.SECOND, 59);
                cal.set(Calendar.MILLISECOND, 999);
                c.gte(from).lte(cal.getTime());
            } else if (from != null) {
                c.gte(from);
            } else c.lte(to);
            and.add(c);
        }

        Query qy = new Query(and.isEmpty() ? new Criteria() : new Criteria().andOperator(and.toArray(Criteria[]::new)));
        qy.with(pageable.getSortOr(Sort.by(Sort.Direction.DESC, "date")));

        long total = mongo.count(qy, Hold.class);
        qy.skip((long) pageable.getPageNumber() * pageable.getPageSize());
        qy.limit(pageable.getPageSize());

        List<Hold> content = mongo.find(qy, Hold.class);
        return new PageImpl<>(content, pageable, total);
    }
}
