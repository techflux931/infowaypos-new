// src/main/java/com/pos/dto/IdName.java
package com.pos.dto;

public class IdName {
    private final String id;
    private final String name;

    public IdName(String id, String name) { this.id = id; this.name = name; }
    public String getId() { return id; }
    public String getName() { return name; }
}
