# Requirements Document

## Introduction

This document specifies the requirements for transforming the GrowEasy CSV Importer from a CRM-specific lead importer into a universal CSV importer capable of handling any type of CSV file. The current system is hardcoded for CRM lead data with strict validation rules that skip rows without email or phone numbers. The universal system will accept and process ANY CSV type (product catalogs, financial data, inventory lists, currency tables, sales reports, etc.) by dynamically detecting fields and intelligently structuring data based on CSV content.

## Glossary

- **System**: The GrowEasy Universal CSV Importer application (frontend + backend)
- **CSV_Parser**: The component that reads and parses CSV file buffers into structured data
- **AI_Processor**: The component that uses AI to analyze CSV content and structure records
- **Validator**: The component that validates and sanitizes processed records
- **Universal_Record**: A dynamically-structured data record with no predefined schema
- **Schema_Detection**: The process of analyzing CSV headers and content to determine data types and structure
- **CRM_Record**: The legacy hardcoded record type for real estate lead data (to be replaced)
- **Raw_CSV_Row**: A single row from the parsed CSV file as a key-value object
- **Skip_Rule**: Logic that determines whether a row should be excluded from import
- **Field_Mapping**: The process of relating CSV column names to structured record fields

## Requirements

### Requirement 1: Accept Any CSV File Type

**User Story:** As a user, I want to upload any type of CSV file (product catalog, financial data, inventory list, currency table, sales report, etc.), so that I can process diverse data without system restrictions.

#### Acceptance Criteria

1. THE System SHALL accept CSV files containing any column headers and data types
2. THE System SHALL NOT enforce hardcoded field requirements from CRM domain
3. WHEN a CSV file contains non-CRM data (e.g., currency codes, product SKUs, inventory counts), THE System SHALL process all rows successfully
4. THE System SHALL NOT skip rows based on absence of email or phone fields

### Requirement 2: Dynamic Schema Detection

**User Story:** As a user, I want the system to automatically detect what type of data is in my CSV, so that I don't have to configure field mappings manually.

#### Acceptance Criteria

1. WHEN a CSV file is uploaded, THE Schema_Detector SHALL analyze column headers to infer data types
2. THE Schema_Detector SHALL identify common data patterns (dates, numbers, emails, phone numbers, URLs, currencies, percentages)
3. THE Schema_Detector SHALL preserve all original column names from the CSV
4. THE AI_Processor SHALL generate a dynamic schema based on detected patterns
5. THE System SHALL NOT require predefined enum values for categorization

### Requirement 3: Remove Hardcoded CRM Constraints

**User Story:** As a developer, I want to remove all CRM-specific logic from the codebase, so that the system can handle any data domain.

#### Acceptance Criteria

1. THE System SHALL remove hardcoded CRM field names (name, email, phone, city, lead_owner, crm_status, etc.)
2. THE System SHALL remove hardcoded enum types (CrmStatus, DataSource)
3. THE System SHALL remove CRM-specific constants (CRM_STATUS_VALUES, DATA_SOURCE_VALUES, CRM_RECORD_FIELDS)
4. THE System SHALL remove validation rules requiring email OR phone number
5. THE System SHALL replace CrmRecord type with Universal_Record type

### Requirement 4: Universal Record Structure

**User Story:** As a system, I want to represent imported data with a flexible structure, so that any CSV schema can be accommodated.

#### Acceptance Criteria

1. THE Universal_Record SHALL contain a dynamic key-value structure matching CSV columns
2. THE Universal_Record SHALL preserve original column names as keys
3. THE Universal_Record SHALL include metadata fields (row_number, import_timestamp)
4. THE Universal_Record SHALL support all primitive data types (string, number, boolean, date)
5. THE Universal_Record SHALL NOT enforce a fixed field schema

### Requirement 5: Intelligent Data Type Inference

**User Story:** As a user, I want the AI to understand what type of data each column contains, so that values are correctly interpreted and formatted.

#### Acceptance Criteria

1. WHEN the AI_Processor analyzes a column, THE AI_Processor SHALL infer whether values are text, numbers, dates, booleans, or structured types
2. WHEN a column contains date strings, THE AI_Processor SHALL normalize them to ISO 8601 format
3. WHEN a column contains numeric strings, THE AI_Processor SHALL preserve numeric precision
4. WHEN a column contains currency values, THE AI_Processor SHALL preserve currency symbols and decimal places
5. THE AI_Processor SHALL handle mixed-type columns by preserving original string representation

### Requirement 6: Zero Row Skipping by Default

**User Story:** As a user, I want all rows from my CSV to be processed successfully, so that I don't lose data due to arbitrary validation rules.

#### Acceptance Criteria

1. THE System SHALL process every row from the uploaded CSV file
2. THE System SHALL NOT skip rows based on missing contact information
3. THE System SHALL NOT enforce domain-specific validation rules (email format, phone format)
4. WHEN a row contains malformed data, THE System SHALL import the row with original values preserved
5. THE System SHALL only skip rows that are completely empty (all fields blank)

### Requirement 7: Generic AI Prompt

**User Story:** As a developer, I want the AI prompt to be domain-agnostic, so that the AI can handle any CSV type without CRM bias.

#### Acceptance Criteria

1. THE AI_Processor SHALL use a prompt that does NOT mention CRM terminology
2. THE AI_Processor prompt SHALL instruct the AI to analyze CSV structure dynamically
3. THE AI_Processor prompt SHALL instruct the AI to preserve all columns from the source CSV
4. THE AI_Processor prompt SHALL instruct the AI to infer data types from content patterns
5. THE AI_Processor prompt SHALL instruct the AI to return all rows without filtering

### Requirement 8: Backward Compatibility with Test CSVs

**User Story:** As a developer, I want the universal importer to successfully process existing CRM test files, so that I can verify the transformation works correctly.

#### Acceptance Criteria

1. WHEN facebook.csv is uploaded, THE System SHALL import all lead records successfully
2. WHEN google_ads.csv is uploaded, THE System SHALL import all advertising records successfully
3. WHEN broker.csv is uploaded, THE System SHALL import all prospect records successfully
4. THE System SHALL maintain existing field mappings for CRM data when detected
5. THE System SHALL produce equivalent or better import success rates compared to the legacy system

### Requirement 9: Universal Validation

**User Story:** As a developer, I want validation logic that works for any data type, so that data integrity is maintained without domain assumptions.

#### Acceptance Criteria

1. THE Validator SHALL verify that each Universal_Record contains keys matching the CSV headers
2. THE Validator SHALL ensure no required CSV columns are missing from imported records
3. THE Validator SHALL NOT validate email format, phone format, or other domain-specific patterns
4. THE Validator SHALL sanitize values to prevent CSV injection attacks
5. THE Validator SHALL convert dates to ISO 8601 when date pattern is detected, otherwise preserve original string

### Requirement 10: Frontend Label Updates

**User Story:** As a user, I want the UI to reflect the universal nature of the importer, so that I understand it works with any CSV type.

#### Acceptance Criteria

1. THE System SHALL display "Import Any CSV" instead of "Import Leads Instantly"
2. THE System SHALL display "AI maps every column automatically" instead of CRM-specific messaging
3. THE System SHALL show column headers from the uploaded CSV in the preview table
4. THE System SHALL display imported records with all original columns visible
5. THE System SHALL update error messages to be domain-agnostic

### Requirement 11: Dynamic Table Rendering

**User Story:** As a user, I want to see all columns from my CSV in the preview and results tables, so that I can verify the import accurately reflects my data.

#### Acceptance Criteria

1. WHEN a CSV is uploaded, THE PreviewTable component SHALL render columns dynamically based on CSV headers
2. THE ResultsTable component SHALL display all fields from Universal_Record dynamically
3. THE System SHALL NOT show hardcoded CRM columns in the results table
4. THE System SHALL handle CSVs with 3 columns or 50 columns equally well
5. THE System SHALL provide horizontal scrolling when column count exceeds viewport width

### Requirement 12: Remove CRM-Specific File Types

**User Story:** As a developer, I want to remove CRM-specific TypeScript types from the codebase, so that the type system reflects universal data handling.

#### Acceptance Criteria

1. THE System SHALL remove the CrmRecord interface
2. THE System SHALL remove the CrmStatus type
3. THE System SHALL remove the DataSource type
4. THE System SHALL introduce a UniversalRecord interface with dynamic fields
5. THE System SHALL update all import/export type references throughout the codebase

### Requirement 13: Test with Diverse CSV Types

**User Story:** As a developer, I want to verify the system works with multiple CSV types, so that I can confirm universal compatibility.

#### Acceptance Criteria

1. WHEN a currency CSV (Code, Symbol, Name) is uploaded, THE System SHALL import 100% of rows
2. WHEN a product catalog CSV is uploaded, THE System SHALL import all products
3. WHEN a sales report CSV is uploaded, THE System SHALL import all transactions
4. WHEN a manually created spreadsheet is uploaded, THE System SHALL import all rows
5. THE System SHALL NOT require test CSVs to contain email or phone fields

### Requirement 14: Preserve Data Integrity

**User Story:** As a user, I want my data values to remain unchanged during import, so that the output matches the input exactly.

#### Acceptance Criteria

1. THE System SHALL NOT modify or hallucinate data values
2. WHEN a CSV contains special characters, THE System SHALL preserve them correctly
3. WHEN a CSV contains multi-line cell values, THE System SHALL preserve line breaks
4. THE System SHALL preserve leading zeros in numeric strings (e.g., SKU codes)
5. THE System SHALL preserve trailing/leading whitespace when present in source data

### Requirement 15: Error Handling for Universal Data

**User Story:** As a user, I want meaningful error messages when something goes wrong, so that I can correct issues and retry the import.

#### Acceptance Criteria

1. WHEN CSV parsing fails, THE System SHALL return error message "Invalid CSV format detected"
2. WHEN AI processing fails, THE System SHALL return error message "Unable to process CSV data"
3. THE System SHALL NOT return CRM-specific error messages (e.g., "Missing email or phone")
4. WHEN a file is too large, THE System SHALL return error message "File exceeds maximum size limit"
5. THE System SHALL log detailed errors server-side while showing user-friendly messages in the UI
