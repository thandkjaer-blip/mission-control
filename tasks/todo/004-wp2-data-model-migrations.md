# 004 - WP2 Data model and migrations

## Owner
Developer / Infrastructure

## Goal
Omsætte DB schema v1 til eksekverbare migrations og en autoritativ persistence-base.

## Scope
- Implementér enums og tabeller fra `docs/DB_SCHEMA_V1.md`
- Tilføj indexes og seed data
- Beslut derived vs source-of-truth felter
- Opret migration smoke tests og reset scripts

## Done when
- DB schema er implementerbart og testbart
- Seed scripts findes
- Persistence-laget kan bruges af API-arbejdet

## Depends on
- 003-wp1-foundation-stack-and-scaffolding.md
