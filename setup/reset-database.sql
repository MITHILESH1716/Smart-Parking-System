-- Run while connected to the "postgres" database (NOT smartparking). Stop the backend first.
-- Wipes the demo data; the app re-creates tables, demo admin, demo driver and demo lot on start.
DROP DATABASE IF EXISTS smartparking WITH (FORCE);
CREATE DATABASE smartparking;
