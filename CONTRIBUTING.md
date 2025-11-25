# Contributing to Smart Piggy AI

## Development Environment Setup

### Required Tools

- Node.js 20.x (via nvm)
- Python 3.10+ with Anaconda
- Snowflake account with database access
- Git for version control

### Initial Configuration

Clone the repository and install dependencies for all three services:

```bash
# Backend
cd backend/database/api
pip install -r requirements.txt

# Frontend
cd clerk-react
npm install

# Agent
cd agent
npm install
```

Configure environment variables as specified in README.md Environment Configuration section.

## Code Organization

### Backend (backend/database/api/)

Core modules:
- main.py: FastAPI application and endpoint definitions
- db.py: Snowflake connection management and query execution
- queries.py: SQL query templates
- models.py: Pydantic schemas for request/response validation

Feature modules:
- predictor.py: Behavioral prediction algorithm
- do_llm.py: DigitalOcean LLM integration
- semantic.py: Semantic search via Snowflake embeddings
- smart_tips.py: Savings recommendation generation
- better_deals.py: Alternative product suggestions
- piggy_graph.py: Spending graph generation
- receipt_processing.py: Gemini Vision integration

### Frontend (clerk-react/src/)

- components/: React components organized by feature
- services/: API client modules (backendApi.ts, nessieApi.ts)
- types/: TypeScript interface definitions
- hooks/: Custom React hooks

### Agent (agent/)

- photon.js: iMessage bot implementation
- aiAgent.js: OpenAI GPT-4 conversation management
- dbClient.js: Backend API client

## Coding Standards

### Python (Backend)

Follow PEP 8 style guidelines:
- Use 4 spaces for indentation
- Maximum line length: 88 characters (Black formatter default)
- Use type hints for function signatures
- Document functions with docstrings

Example:
```python
from typing import List, Dict, Any

def fetch_transactions(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Retrieve transaction history for specified user.

    Args:
        user_id: Unique user identifier
        limit: Maximum number of transactions to return

    Returns:
        List of transaction dictionaries with keys: id, item, amount, date, category
    """
    # Implementation
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Define interfaces for all data structures
- Prefer functional components with hooks
- Use async/await for asynchronous operations

Example:
```typescript
interface Transaction {
  id: string;
  item: string;
  amount: number;
  date: string;
  category: string;
}

async function fetchUserTransactions(userId: string, limit: number): Promise<Transaction[]> {
  const response = await fetch(`${API_URL}/api/user/${userId}/transactions?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
```

### JavaScript (Agent)

- Use ES6+ syntax (import/export, async/await, arrow functions)
- Document complex function calling logic
- Maintain conversation history limits to prevent token overflow
- Log all function executions for debugging

## Testing

### Backend Tests

Run backend health check:
```bash
curl http://localhost:8000/health
```

Test specific endpoints:
```bash
curl "http://localhost:8000/api/user/15514049519/transactions?limit=5"
curl "http://localhost:8000/api/predict?user_id=15514049519&limit=3"
```

### Frontend Tests

Build and lint:
```bash
cd clerk-react
npm run build
npm run lint
```

### Integration Tests

Run full integration test suite:
```bash
./test-integration.sh
```

## Database Modifications

### Schema Changes

All schema modifications must be documented in ARCHITECTURE.md. When modifying PURCHASE_ITEMS_TEST table structure:

1. Document the change in migration notes
2. Update queries.py SQL templates
3. Update models.py Pydantic schemas
4. Update TypeScript interfaces in clerk-react/src/types/index.ts
5. Test with existing data

### Query Optimization

For queries against large transaction datasets:
- Use indexed columns (USER_ID, TS) in WHERE clauses
- Limit result sets with LIMIT clause
- Avoid SELECT * in production queries
- Use prepared statements via Snowflake connector parameterization

## API Development

### Adding New Endpoints

1. Define Pydantic model in models.py if request/response validation needed
2. Add SQL query to queries.py if database access required
3. Implement endpoint function in main.py with proper error handling
4. Add endpoint to API Endpoints table in README.md
5. Test with curl before client integration

Example endpoint structure:
```python
@app.get("/api/example/{user_id}")
def example_endpoint(
    user_id: str,
    limit: int = Query(10, ge=1, le=100)
) -> List[Dict[str, Any]]:
    """
    Endpoint description.
    """
    try:
        result = fetch_all(SQL_QUERY, {"user_id": user_id, "limit": limit})
        return result
    except Exception as e:
        print(f"Error: {repr(e)}")
        raise HTTPException(status_code=500, detail="Error message")
```

## AI Agent Function Calling

### Adding New Functions

When extending agent capabilities:

1. Define function tool in aiAgent.js tools array with clear description
2. Implement function execution in executeFunction() switch statement
3. Add corresponding backend API call in dbClient.js
4. Test function independently before integration
5. Document function in README.md Available agent functions section

Function tool structure:
```javascript
{
    type: 'function',
    function: {
        name: 'function_name',
        description: 'Clear description of when to use this function',
        parameters: {
            type: 'object',
            properties: {
                param_name: {
                    type: 'number',
                    description: 'Parameter purpose and default value',
                    default: 10
                }
            }
        }
    }
}
```

## Git Workflow

### Branch Naming

- feature/description: New features
- fix/description: Bug fixes
- refactor/description: Code refactoring
- docs/description: Documentation updates

### Commit Messages

Use conventional commit format:

```
type(scope): subject

body (optional)
```

Types: feat, fix, docs, refactor, test, chore

Examples:
```
feat(backend): add transaction filtering by date range
fix(agent): resolve conversation history memory leak
docs(readme): update environment setup instructions
```

### Pull Request Process

1. Create feature branch from main
2. Implement changes with tests
3. Update documentation if API or behavior changes
4. Run integration tests
5. Submit pull request with description of changes
6. Address review feedback

## Performance Considerations

### Backend

- Use database connection pooling (implemented in db.py get_conn)
- Cache frequent queries when appropriate
- Limit query result sets to reasonable sizes
- Monitor Snowflake query execution time

### Frontend

- Lazy load components when appropriate
- Memoize expensive computations
- Debounce user input for search/filter operations
- Optimize React re-renders with useMemo and useCallback

### Agent

- Maintain conversation history limit (currently 20 messages)
- Implement rate limiting for API calls if needed
- Cache prediction results when recency permits

## Debugging

### Backend Debugging

Enable uvicorn reload mode for development:
```bash
python -m uvicorn database.api.main:app --reload --port 8000
```

Check logs:
```bash
tail -f backend.log
```

### Frontend Debugging

Use browser developer tools:
- Network tab for API request inspection
- Console for error messages
- React DevTools for component state

### Agent Debugging

Agent logs function calls and responses to console. Monitor output:
```bash
tail -f agent.log
```

## Documentation Requirements

### Code Documentation

- All public functions must have docstrings/JSDoc comments
- Complex algorithms require inline comments explaining logic
- Non-obvious type conversions must be documented

### API Documentation

FastAPI automatically generates OpenAPI documentation at http://localhost:8000/docs when backend is running.

### Architecture Documentation

Significant architectural changes require updates to ARCHITECTURE.md:
- New services or components
- Changes to data flow
- Modifications to prediction algorithms
- Integration of new external APIs

## Questions and Support

For development questions:
1. Check existing documentation in README.md, ARCHITECTURE.md, and CLAUDE.md
2. Review closed issues in repository
3. Open new issue with detailed description of problem
