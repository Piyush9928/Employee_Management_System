# Here are your Instructions
# FastAPI Project

## Installation
```bash
pip install -r requirements.txt
```

## Running the app
```bash
uvicorn main:app --reload
```

## Testing the app
```bash
curl -X 'GET' \
  'http://127.0.0.1:8000/' \
  -H 'accept: application/json'
```

## Running the tests
```bash
pytest
```

## Running the linter
```bash
flake8
```

## Running the type checker
```bash
mypy
```

## Running the formatter
```bash
black
```