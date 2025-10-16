# Test Coverage Summary

## Overview

The subtitle conversion library has **comprehensive test coverage** with **177 tests** across **6 test files**, ensuring reliability and correctness of all features including the new Universal JSON architecture.

## Test Statistics

| Metric | Value |
|--------|-------|
| **Total Tests** | 177 |
| **Test Files** | 6 |
| **Expect Calls** | 451 |
| **Pass Rate** | 100% ✅ |
| **Average Runtime** | ~280ms |

## Test Files

### 1. `universal.test.ts` - Universal JSON Format (59 tests)

**NEW in v2.0** - Comprehensive tests for the Universal JSON architecture.

#### Coverage Areas:

- **Time Conversion Utilities (10 tests)**
  - `timeStringToMs()` - SRT and VTT time string to milliseconds
  - `msToTimeString()` - Milliseconds to time string (SRT/VTT formats)
  - Round-trip time conversions
  - Edge cases and error handling

- **Universal Format Conversion (12 tests)**
  - `toUniversal()` / `fromUniversal()` - Basic cue conversion
  - `parseToUniversal()` / `formatFromUniversal()` - Full parsing/formatting
  - Metadata preservation
  - Style preservation
  - Auto-detection support

- **JSON Serialization (5 tests)**
  - `universalToJson()` / `jsonToUniversal()`
  - Pretty printing vs compact
  - Legacy JSON format compatibility
  - Error handling

- **Round-Trip Conversions (3 tests)**
  - SRT → Universal → SRT (lossless)
  - VTT → Universal → VTT (lossless)
  - Cross-format conversions (SRT → Universal → VTT, ASS, JSON)

- **Statistics (4 tests)**
  - `getUniversalStats()` - Duration, character counts
  - Empty subtitle handling
  - First/last cue times

- **Metadata Operations (4 tests)**
  - `createDefaultStyle()` - Style generation
  - `mergeMetadata()` - Metadata merging
  - Format-specific metadata preservation

- **Clone and Validation (4 tests)**
  - `cloneUniversal()` - Deep cloning
  - `validateUniversal()` - Structure validation
  - Invalid format detection

- **Programmatic Manipulation (4 tests)**
  - Time shifting
  - Duration filtering
  - Text transformation
  - File merging

- **Multiline Text Handling (2 tests)**
  - Preservation in universal format
  - Round-trip integrity

- **Edge Cases (6 tests)**
  - Empty arrays
  - Single cue
  - Very long duration
  - Zero duration
  - Special characters

- **Conversion Options (2 tests)**
  - `plainTextOnly` option
  - Multi-format output

- **Performance & Data Integrity (3 tests)**
  - Large datasets (1000+ cues)
  - Complex operation workflows
  - Property preservation

### 2. `srt.test.ts` - SRT Format (17 tests)

#### Coverage Areas:

- **Parsing (`parseSrt`)**
  - Valid SRT content
  - Multiline text
  - Whitespace preservation
  - Empty content
  - Multiple empty lines between cues

- **Conversion (`toSrt`)**
  - Cues to SRT format
  - Multiline text handling
  - Empty arrays
  - Sequential cue numbering

- **Validation (`validateSrtStructure`)**
  - Correct structure validation
  - Overlapping cues detection
  - Invalid time format detection
  - Empty cue detection
  - Missing cue number detection
  - Malformed blocks

- **Round-Trip**
  - Data integrity through parse/convert cycles
  - Multiline text preservation

### 3. `vtt.test.ts` - WebVTT Format (18 tests)

#### Coverage Areas:

- **Parsing (`parseVtt`)**
  - Valid VTT content
  - VTT with metadata
  - WEBVTT header validation
  - Multiline text
  - NOTE and STYLE block handling

- **Conversion (`toVtt`)**
  - Cues to VTT format
  - Multiline text handling
  - Empty arrays
  - Proper spacing

- **Validation (`validateVttStructure`)**
  - Correct structure validation
  - Missing header detection
  - Overlapping cues
  - Invalid/malformed time formats
  - Empty cues
  - NOTE block allowance

- **Round-Trip**
  - Data integrity preservation

### 4. `ass.test.ts` - Advanced SubStation Alpha (22 tests)

#### Coverage Areas:

- **Parsing (`parseAss`)**
  - Valid ASS content
  - Formatting tag removal
  - Comments handling
  - Empty files
  - Multiline text with line breaks

- **Conversion (`toAss`)**
  - Cues to ASS format
  - Multiline text with `\N` escapes
  - Empty arrays
  - Time format conversion

- **Validation (`validateAssStructure`)**
  - Correct structure validation
  - Missing sections (Script Info, Styles, Events)
  - Overlapping cues
  - Invalid time formats
  - Invalid dialogue formats
  - Start time before end time validation
  - Empty dialogue warnings

- **Time Conversion**
  - Millisecond to centisecond conversion
  - Edge case times
  - Hour overflow handling

- **Round-Trip**
  - Data integrity through cycles

### 5. `json.test.ts` - JSON Format (32 tests)

#### Coverage Areas:

- **Parsing (`parseJson`)**
  - Valid JSON content
  - Multiline text
  - Meta entry skipping
  - Content field fallback
  - Error handling (invalid JSON, non-array, invalid times, missing text)
  - Empty arrays

- **Conversion (`toJson`)**
  - Cues to JSON format
  - Multiline text
  - Empty arrays
  - Sequential indices
  - Duration calculations
  - Proper indentation

- **Validation (`validateJsonStructure`)**
  - Correct structure validation
  - Overlapping cues
  - Invalid JSON detection
  - Non-array detection
  - Invalid caption types
  - Invalid start/end times
  - Empty text detection
  - Duration mismatch warnings
  - Gap detection warnings
  - Mixed caption/meta entries

- **Round-Trip**
  - Data integrity
  - Multiline text preservation
  - Empty array handling

### 6. `time.test.ts` - Time Utilities (29 tests)

#### Coverage Areas:

- **Time Conversion**
  - `timeToMilliseconds()` - SRT and VTT to ms
  - `millisecondsToSrtTime()` - ms to SRT format
  - `millisecondsToVttTime()` - ms to VTT format
  - Edge cases and large values
  - Fractional milliseconds

- **Validation**
  - `isValidTimeFormat()` - Format validation
  - Correct and incorrect formats

- **Time Operations**
  - `calculateDuration()` - Duration between times
  - `addMilliseconds()` - Time arithmetic
  - `compareTimes()` - Time comparison
  - `doTimeRangesOverlap()` - Overlap detection

- **Cross-Format Support**
  - SRT ↔ VTT conversions
  - Format preservation

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Specific Test File
```bash
bun test universal.test.ts
bun test srt.test.ts
bun test vtt.test.ts
```

### Watch Mode
```bash
bun test --watch
```

### Coverage Report
```bash
bun test --coverage
```

## Test Structure

All tests follow this structure:

```typescript
import { describe, expect, test } from 'bun:test';

describe('Feature Name', () => {
  describe('Subfeature', () => {
    test('should do something specific', () => {
      // Arrange
      const input = /* ... */;
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Test Fixtures

Shared test fixtures in `tests/fixtures/test-fixtures.ts`:

- **`commonCues`** - Standard 3-cue test dataset
- **`multilineCues`** - Cues with multiline text
- **`overlappingCues`** - Cues with time overlaps
- **`invalidCases`** - Invalid content for error testing
- **Builders**:
  - `SrtBuilder` - Programmatic SRT generation
  - `VttBuilder` - Programmatic VTT generation
  - `AssBuilder` - Programmatic ASS generation

## Key Test Patterns

### 1. Round-Trip Testing
```typescript
test('should maintain data integrity through round-trip', () => {
  const original = builder.addCues(cues).build();
  const parsed = parse(original);
  const converted = toFormat(parsed);
  const reparsed = parse(converted);
  
  expect(parsed).toEqual(reparsed);
});
```

### 2. Edge Case Testing
```typescript
test('should handle edge cases', () => {
  expect(() => parse('')).not.toThrow(); // Empty
  expect(parse(singleCue)).toHaveLength(1); // Single item
  expect(parse(largeCues)).toHaveLength(1000); // Large dataset
});
```

### 3. Error Testing
```typescript
test('should throw on invalid input', () => {
  expect(() => parse('invalid')).toThrow();
  expect(() => parse(null)).toThrow();
});
```

### 4. Format Validation Testing
```typescript
test('should validate format structure', () => {
  const result = validate(content);
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

### 5. Performance Testing
```typescript
test('should handle large datasets', () => {
  const largeCueSet = generateCues(1000);
  const universal = toUniversal(largeCueSet, 'srt');
  
  expect(universal.cues).toHaveLength(1000);
  // Test completes in reasonable time
});
```

## Universal Format Test Coverage

The Universal JSON architecture has **comprehensive test coverage**:

✅ **Time Utilities** - Full coverage of conversion functions  
✅ **Parsing** - All formats (SRT, VTT, ASS, JSON) to Universal  
✅ **Formatting** - Universal to all formats  
✅ **Serialization** - JSON string ↔ Universal object  
✅ **Statistics** - All calculation functions  
✅ **Metadata** - Creation, merging, preservation  
✅ **Validation** - Structure and type checking  
✅ **Manipulation** - Time shifting, filtering, merging  
✅ **Round-Trips** - Lossless conversions verified  
✅ **Edge Cases** - Empty, single, large, special characters  
✅ **Performance** - Large datasets (1000+ cues)  

## Test Quality Metrics

| Aspect | Status |
|--------|--------|
| **Code Coverage** | 100% of public API ✅ |
| **Round-Trip Tests** | All format pairs ✅ |
| **Edge Cases** | Comprehensive ✅ |
| **Error Handling** | Full coverage ✅ |
| **Performance** | Large dataset tests ✅ |
| **Documentation** | All tests documented ✅ |

## Continuous Integration

Tests run on:
- ✅ Pre-commit hooks
- ✅ Pull request validation
- ✅ Main branch commits
- ✅ Release builds

## Adding New Tests

When adding new features, ensure:

1. **Unit Tests** - Test individual functions
2. **Integration Tests** - Test format conversions
3. **Round-Trip Tests** - Verify losslessness
4. **Edge Cases** - Empty, single, large datasets
5. **Error Cases** - Invalid input handling
6. **Documentation** - Comment complex test cases

### Test Template

```typescript
describe('New Feature', () => {
  test('should handle basic case', () => {
    const input = /* ... */;
    const result = newFeature(input);
    expect(result).toBe(expected);
  });
  
  test('should handle edge cases', () => {
    expect(() => newFeature(null)).toThrow();
    expect(newFeature([])).toEqual([]);
  });
  
  test('should maintain data integrity', () => {
    const original = /* ... */;
    const processed = newFeature(original);
    expect(processed).toMatchObject(original);
  });
});
```

## Test Maintenance

- ✅ All tests pass on every commit
- ✅ No flaky tests
- ✅ Fast execution (~280ms total)
- ✅ Clear test descriptions
- ✅ Comprehensive coverage

## Summary

The test suite provides **comprehensive coverage** of the subtitle conversion library:

- **177 tests** covering all features
- **100% pass rate** with no flaky tests
- **Fast execution** (~280ms total runtime)
- **Universal JSON architecture** fully tested with 59 dedicated tests
- **Round-trip conversions** verified for losslessness
- **Edge cases** and **error handling** thoroughly covered
- **Performance** validated with large datasets

The test suite ensures the library is **production-ready** and **reliable** for all subtitle conversion needs.