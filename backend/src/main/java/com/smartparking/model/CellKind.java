package com.smartparking.model;

/**
 * SLOT    = bookable parking bay (the "anchor" cell of the bay)
 * COVERED = the second cell of a 2-cell car bay. Not drawn, not bookable, owned by the bay next to it
 * AISLE   = driving lane / empty space
 * BLOCKED = out of service
 */
public enum CellKind { SLOT, COVERED, AISLE, BLOCKED }
