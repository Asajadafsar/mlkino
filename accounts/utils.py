from rest_framework import status
from rest_framework.response import Response


def success_response(message="", data=None, status_code=status.HTTP_200_OK):
    body = {
        "success": True,
        "message": message,
        "errors": [],
    }
    if data is not None:
        body["data"] = data
    return Response(body, status=status_code)


def error_response(message="", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    if errors is None:
        errors = []
    if isinstance(errors, dict):
        normalized = []
        for field, msgs in errors.items():
            if isinstance(msgs, (list, tuple)):
                for msg in msgs:
                    normalized.append({"field": field, "message": str(msg)})
            else:
                normalized.append({"field": field, "message": str(msgs)})
        errors = normalized
    elif isinstance(errors, str):
        errors = [{"message": errors}]

    body = {
        "success": False,
        "message": message,
        "errors": errors,
    }
    return Response(body, status=status_code)