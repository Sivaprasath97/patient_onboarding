from fastapi import HTTPException


def field_error(field: str, msg: str) -> HTTPException:
    """422 in FastAPI's validation format, so the frontend shows it under the matching field."""
    return HTTPException(status_code=422, detail=[{"loc": ["body", field], "msg": msg, "type": "value_error"}])
