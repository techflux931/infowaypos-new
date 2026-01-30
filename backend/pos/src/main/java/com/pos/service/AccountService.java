package com.pos.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.pos.model.Account;
import com.pos.model.AccountGroup;
import com.pos.repository.AccountGroupRepository;
import com.pos.repository.AccountRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {
  private final AccountGroupRepository groupRepo;
  private final AccountRepo accountRepo;

  public List<AccountGroup> listGroups() {
    return groupRepo.findAll(Sort.by("name"));
  }

  public List<Account> listAccounts() {
    return accountRepo.findAll(Sort.by("code"));
  }
}
