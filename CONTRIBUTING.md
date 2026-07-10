# Contributing to GrowEasy CSV Importer

First off, thank you for considering contributing to GrowEasy CSV Importer! 🎉

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Guidelines](#coding-guidelines)
5. [Commit Messages](#commit-messages)
6. [Pull Request Process](#pull-request-process)
7. [Testing Guidelines](#testing-guidelines)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to support@groweasy.com.

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together and help each other
- **Be Professional**: Focus on constructive feedback
- **Be Inclusive**: Welcome contributors of all backgrounds and experience levels

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**How to Submit a Good Bug Report:**

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Upload CSV with '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js Version: [e.g., 20.10.0]
- CSV File: [attach or describe structure]

**Additional Context**
Add any other context about the problem here.
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed functionality
- **Use cases** explaining why this would be useful
- **Possible implementation** if you have ideas

### 🔧 Code Contributions

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes**
4. **Write/update tests**
5. **Update documentation**
6. **Submit a pull request**

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- NVIDIA API key (for testing)
- Code editor (VS Code recommended)

### Initial Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/groweasy-csv-importer.git
cd groweasy-csv-importer

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY
npm install

# 3. Setup frontend
cd ../frontend
cp .env.local.example .env.local
npm install

# 4. Run tests
cd ../backend
npm test

# 5. Start development servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed codebase overview.

---

## Coding Guidelines

### TypeScript

- **Use TypeScript** for all new code (no plain JavaScript)
- **Enable strict mode** in tsconfig.json
- **Define interfaces** for all data structures
- **Use type annotations** for function parameters and return types
- **Avoid `any`** type - use `unknown` if truly needed

**Example:**
```typescript
// ✅ Good
interface CsvRow {
  name: string;
  email: string;
  phone?: string;
}

function processRow(row: CsvRow): ProcessedRecord {
  return { ...row, processed: true };
}

// ❌ Bad
function processRow(row: any) {
  return { ...row, processed: true };
}
```

### Code Style

- **Use 2 spaces** for indentation
- **Use semicolons** at the end of statements
- **Use single quotes** for strings (except in JSX)
- **Use trailing commas** in multi-line arrays/objects
- **Use async/await** over raw promises
- **Use destructuring** where appropriate

**Formatting:**
```bash
# We use built-in formatters
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### React/Next.js Guidelines

- **Use functional components** with hooks (no class components)
- **Use TypeScript** for all components
- **Define prop types** with interfaces
- **Use semantic HTML** elements
- **Follow accessibility** best practices (ARIA labels, keyboard navigation)
- **Keep components small** and focused (< 200 lines)

**Example:**
```tsx
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn"
      aria-label={label}
    >
      {label}
    </button>
  );
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Backend Guidelines

- **Use Express middleware** for cross-cutting concerns
- **Validate input** at API boundaries
- **Handle errors** with try-catch and proper status codes
- **Log appropriately** (use console.log for development, structured logging for production)
- **Keep routes thin** - move logic to services
- **Use async/await** consistently

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build config)

### Examples

```bash
# Feature
feat(backend): add support for Excel file uploads

# Bug fix
fix(frontend): correct date formatting in results table

# Documentation
docs(readme): update deployment instructions for Docker

# Refactor
refactor(aiExtractor): simplify batch processing logic

# Test
test(validator): add tests for CSV injection prevention
```

### Best Practices

- **Keep subject line under 72 characters**
- **Use imperative mood** ("add" not "added", "fix" not "fixed")
- **Capitalize first letter** of subject
- **No period** at end of subject
- **Reference issues** in footer (e.g., "Closes #123")

---

## Pull Request Process

### Before Submitting

1. ✅ **Test your changes** locally
2. ✅ **Run all tests** (`npm test`)
3. ✅ **Check for TypeScript errors** (`npm run build`)
4. ✅ **Update documentation** if needed
5. ✅ **Add tests** for new features
6. ✅ **Ensure code follows style guidelines**

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran to verify your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to demonstrate UI changes.

## Related Issues
Closes #(issue number)
```

### Review Process

1. **Submit PR** with clear description
2. **Wait for review** from maintainers
3. **Address feedback** promptly
4. **Update PR** with requested changes
5. **Await approval** and merge

### PR Guidelines

- **One feature per PR** - keep changes focused
- **Small PRs** are easier to review (aim for < 500 lines)
- **Provide context** in PR description
- **Link related issues** in description
- **Update CHANGELOG.md** for user-facing changes
- **Be responsive** to review feedback

---

## Testing Guidelines

### Unit Tests

- **Test business logic** in services
- **Test edge cases** and error conditions
- **Mock external dependencies** (AI API, file system)
- **Use descriptive test names**

**Example:**
```typescript
describe('validateAndSanitizeRecord', () => {
  it('should sanitize CSV injection attempts', () => {
    const input = { formula: '=1+1' };
    const result = validateAndSanitizeRecord(input, schema, {}, 1);
    expect(result.record.formula).toBe("'=1+1");
  });

  it('should skip completely empty rows', () => {
    const input = { name: '', email: '', phone: '' };
    const result = validateAndSanitizeRecord(input, schema, input, 1);
    expect('skipped' in result).toBe(true);
  });
});
```

### Integration Tests

- **Test API endpoints** with sample CSV files
- **Test mode switching** (CRM/Universal)
- **Test error handling** (invalid files, API failures)

### Manual Testing

```bash
# Test with sample CSVs
cd test-csvs
for file in *.csv; do
  curl -X POST http://localhost:4000/api/import?mode=crm \
    -F "file=@$file"
done
```

---

## Areas That Need Help

We especially welcome contributions in these areas:

- 🎨 **UI/UX Improvements** - Enhanced animations, better mobile support
- ⚡ **Performance** - Parallel processing, streaming, virtual scrolling
- 🧪 **Testing** - More unit tests, E2E tests, visual regression tests
- 📚 **Documentation** - Tutorials, video guides, API examples
- 🌍 **Internationalization** - Multi-language support
- ♿ **Accessibility** - WCAG 2.1 AA compliance improvements
- 🔒 **Security** - Security audits, dependency updates

---

## Questions?

- 📧 **Email**: support@groweasy.com
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to contributors list (if significant contribution)

Thank you for contributing! 🙏
