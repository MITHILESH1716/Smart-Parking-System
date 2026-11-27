-- Clean setup for the updated SmartParking schema. This permanently removes all demo data.
-- Run while connected to the postgres database (NOT smartparking) and stop the backend first.
DROP DATABASE IF EXISTS smartparking WITH (FORCE);
CREATE DATABASE smartparking;
-- Start the backend; Hibernate creates the updated floor, bay-type, and subscription tables.
